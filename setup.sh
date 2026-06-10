#!/bin/bash

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   Sistem Manajemen Invoice NOC - Auto Installer  ${NC}"
echo -e "${BLUE}==================================================${NC}"

# Periksa Node.js
if ! command -v node &> /dev/null
then
    echo -e "${RED}Error: Node.js tidak ditemukan. Silakan install Node.js (v16+) terlebih dahulu.${NC}"
    exit 1
fi

# Periksa Git
if ! command -v git &> /dev/null
then
    echo -e "${RED}Error: Git tidak ditemukan. Silakan install Git terlebih dahulu.${NC}"
    exit 1
fi

# Fungsi untuk mengecek apakah port tersedia
is_port_free() {
    if command -v lsof >/dev/null; then
        lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null && return 1 || return 0
    elif command -v netstat >/dev/null; then
        netstat -tuln | grep -q ":$1 " && return 1 || return 0
    else
        return 0 # Jika tidak ada tool pengecek, asumsikan free (risiko kecil)
    fi
}

# Pengaturan direktori
REPO_URL="https://github.com/heruhendri/sistem-manajemen-invoice-noc.git"
DIR_NAME="sistem-manajemen-invoice-noc"

# Clone repository
echo -e "${GREEN}1. Mengunduh kode sumber dari GitHub...${NC}"
if [ -d "$DIR_NAME" ]; then
    echo -e "${RED}Folder $DIR_NAME sudah ada. Menghapus folder lama untuk instalasi bersih...${NC}"
    rm -rf "$DIR_NAME"
fi

echo -e "${GREEN}0. Konfigurasi Alamat Akses Aplikasi...${NC}"
read -p "Masukkan IP atau Domain yang akan digunakan untuk mengakses aplikasi (misal: 192.168.1.100 atau myapp.com, kosongkan untuk 'localhost'): " DOMAIN_INPUT < /dev/tty

git clone $REPO_URL
cd $DIR_NAME

# Selalu gunakan 0.0.0.0 untuk binding server agar kompatibel dengan NAT VPS
HOST_TO_USE="0.0.0.0"
# Mendapatkan IP lokal jika domain dikosongkan untuk tampilan URL akhir
DISPLAY_HOST=${DOMAIN_INPUT:-$(hostname -I | awk '{print $1}')}

# Install dependencies
echo -e "${GREEN}2. Menginstal dependensi (npm install)...${NC}"
npm install

echo -e "${GREEN}2.5 Membangun aplikasi (build) untuk performa VPS...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}3. Konfigurasi Port Jaringan...${NC}"
    echo -e "Pilih opsi port untuk menjalankan aplikasi:"
    echo -e "1) Port Default (5173)"
    echo -e "2) Masukkan Port Custom"
    echo -e "3) Cari Port Kosong Otomatis"
        read -p "Masukkan pilihan (1/2/3): " port_option < /dev/tty

    APP_PORT=5173
    case $port_option in
        2)
                read -p "Masukkan nomor port yang diinginkan: " APP_PORT < /dev/tty
            ;;
        3)
            echo -e "${YELLOW}Mencari port kosong mulai dari 5173...${NC}"
            while ! is_port_free $APP_PORT; do
                APP_PORT=$((APP_PORT+1))
            done
            echo -e "${GREEN}Port ditemukan: $APP_PORT${NC}"
            ;;
        *)
            APP_PORT=5173
            ;;
    esac

    # Cek apakah port yang dipilih benar-benar tersedia
    if ! is_port_free $APP_PORT; then
        echo -e "${YELLOW}Peringatan: Port $APP_PORT tampaknya sedang digunakan. Aplikasi mungkin gagal dijalankan jika ada konflik.${NC}"
    fi

    echo -e "${GREEN}4. Opsi PM2 (Process Manager)...${NC}"
        read -p "Apakah ingin menggunakan PM2 agar aplikasi berjalan otomatis di background? (y/n): " use_pm2 < /dev/tty

    if [[ "$use_pm2" =~ ^[Yy]$ ]]; then
        if ! command -v pm2 &> /dev/null; then
            echo -e "${YELLOW}PM2 tidak ditemukan. Menginstal PM2 secara global...${NC}"
            sudo npm install -g pm2
        fi

        # Hapus proses lama jika ada
        pm2 delete noc-billing &> /dev/null
        
        # Jalankan dengan PM2 dalam mode produksi (lebih ringan & stabil)
        echo -e "${GREEN}Menjalankan aplikasi dengan PM2 di port $APP_PORT...${NC}"
        NODE_ENV=production PORT=$APP_PORT HOST=$HOST_TO_USE pm2 start npm --name "noc-billing" -- run dev
        pm2 save
        
        echo -e "${GREEN}Instalasi selesai!${NC}"
        echo -e "${BLUE}==================================================${NC}"
        FINAL_URL="http://$DISPLAY_HOST:$APP_PORT"
        echo -e "Aplikasi berjalan di background dengan PM2."
        echo -e "URL: ${GREEN}$FINAL_URL${NC}"
        echo -e "Gunakan '${YELLOW}pm2 status${NC}' untuk melihat status."
        echo -e "Gunakan '${YELLOW}pm2 logs noc-billing${NC}' untuk melihat log."
        echo -e "Gunakan '${RED}pm2 restart noc-billing${NC}' untuk memuat ulang."
        echo -e "${BLUE}==================================================${NC}"
    else
        echo -e "${GREEN}Instalasi selesai!${NC}"
        echo -e "${BLUE}==================================================${NC}"
        FINAL_URL="http://$DISPLAY_HOST:$APP_PORT"
        echo -e "Untuk menjalankan aplikasi secara manual:"
        echo -e "${GREEN}cd $DIR_NAME${NC}"
        echo -e "${GREEN}NODE_ENV=production PORT=$APP_PORT HOST=$HOST_TO_USE npm run dev${NC}"
        echo -e "Akses di: ${GREEN}$FINAL_URL${NC}"
        echo -e "${BLUE}==================================================${NC}"
    fi
else
    echo -e "${RED}Terjadi kesalahan saat menginstal dependensi.${NC}"
    exit 1
fi
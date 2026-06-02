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

git clone $REPO_URL
cd $DIR_NAME

# Install dependencies
echo -e "${GREEN}2. Menginstal dependensi (npm install)...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}3. Instalasi selesai!${NC}"
    echo -e "${BLUE}==================================================${NC}"
    echo -e "Untuk menjalankan aplikasi:"
    echo -e "${GREEN}cd $DIR_NAME && npm run dev${NC}"
    echo -e "${BLUE}==================================================${NC}"
else
    echo -e "${RED}Terjadi kesalahan saat menginstal dependensi.${NC}"
    exit 1
fi
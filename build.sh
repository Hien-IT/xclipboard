#!/bin/bash
# Exit on any error
set -e

echo "🚀 Bắt đầu quá trình build XClipBoard..."

# Cài đặt dependencies nếu chưa có
echo "📦 Đang cài đặt thư viện..."
npm install

# Build ứng dụng
echo "🔨 Đang đóng gói ứng dụng (DMG)..."
npm run build

echo "✅ Build thành công! File DMG của bạn đã sẵn sàng tại thư mục dist/"

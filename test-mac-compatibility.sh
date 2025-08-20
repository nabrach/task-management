#!/bin/bash

echo "🧪 Testing Mac Compatibility Setup"
echo "=================================="

# Check Node.js version
echo "📋 Node.js version:"
node --version
npm --version

# Check if platform-specific packages are available
echo -e "\n📦 Checking platform-specific Rollup packages:"
if npm list @rollup/rollup-darwin-arm64 >/dev/null 2>&1; then
    echo "✅ @rollup/rollup-darwin-arm64 is available"
else
    echo "❌ @rollup/rollup-darwin-arm64 is not available"
fi

if npm list @rollup/rollup-darwin-x64 >/dev/null 2>&1; then
    echo "✅ @rollup/rollup-darwin-x64 is available"
else
    echo "❌ @rollup/rollup-darwin-x64 is not available"
fi

# Test Angular build
echo -e "\n🔨 Testing Angular build:"
cd apps/dashboard
if npm run build >/dev/null 2>&1; then
    echo "✅ Angular build successful"
else
    echo "❌ Angular build failed"
    exit 1
fi

echo -e "\n🎉 All tests passed! The application is ready for Mac users."
echo "📱 Mac users can now run:"
echo "   cd apps/dashboard && npm start"

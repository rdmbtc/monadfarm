#!/usr/bin/env node
// scripts/analyze-bundle.js
// Bundle size analysis and monitoring

const fs = require('fs')
const path = require('path')

function analyzeBundleSize() {
  const outDir = path.join(process.cwd(), 'out')
  const staticDir = path.join(outDir, '_next', 'static')
  
  if (!fs.existsSync(staticDir)) {
    console.log('❌ Build output not found. Run "npm run build" first.')
    return
  }

  const chunks = []
  
  function scanDirectory(dir, prefix = '') {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        scanDirectory(filePath, `${prefix}${file}/`)
      } else if (file.endsWith('.js')) {
        const size = stat.size
        const sizeKB = (size / 1024).toFixed(2)
        
        chunks.push({
          name: `${prefix}${file}`,
          size: size,
          sizeKB: parseFloat(sizeKB),
          type: getChunkType(file)
        })
      }
    })
  }
  
  function getChunkType(filename) {
    if (filename.includes('framework')) return 'Framework'
    if (filename.includes('main')) return 'Main'
    if (filename.includes('webpack')) return 'Webpack Runtime'
    if (filename.includes('vendor') || filename.includes('node_modules')) return 'Vendor'
    if (filename.match(/^\d+/)) return 'Dynamic Import'
    return 'Page'
  }
  
  scanDirectory(staticDir)
  
  // Sort by size (largest first)
  chunks.sort((a, b) => b.size - a.size)
  
  console.log('\n📊 Bundle Size Analysis')
  console.log('========================\n')
  
  // Summary by type
  const summary = chunks.reduce((acc, chunk) => {
    if (!acc[chunk.type]) {
      acc[chunk.type] = { count: 0, totalSize: 0 }
    }
    acc[chunk.type].count++
    acc[chunk.type].totalSize += chunk.sizeKB
    return acc
  }, {})
  
  console.log('📋 Summary by Type:')
  Object.entries(summary).forEach(([type, data]) => {
    console.log(`  ${type}: ${data.count} files, ${data.totalSize.toFixed(2)} KB`)
  })
  
  console.log('\n🔍 Largest Chunks:')
  chunks.slice(0, 10).forEach((chunk, index) => {
    const emoji = chunk.sizeKB > 100 ? '🔴' : chunk.sizeKB > 50 ? '🟡' : '🟢'
    console.log(`  ${index + 1}. ${emoji} ${chunk.name} - ${chunk.sizeKB} KB (${chunk.type})`)
  })
  
  // Recommendations
  console.log('\n💡 Optimization Recommendations:')
  
  const largeChunks = chunks.filter(c => c.sizeKB > 100)
  if (largeChunks.length > 0) {
    console.log('  🔴 Large chunks detected (>100KB):')
    largeChunks.forEach(chunk => {
      console.log(`    - Consider code splitting for: ${chunk.name}`)
    })
  }
  
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.sizeKB, 0)
  console.log(`\n📈 Total Bundle Size: ${totalSize.toFixed(2)} KB`)
  
  if (totalSize > 1000) {
    console.log('  ⚠️  Bundle size is quite large. Consider:')
    console.log('    - Implementing more aggressive code splitting')
    console.log('    - Using dynamic imports for non-critical features')
    console.log('    - Analyzing dependencies with webpack-bundle-analyzer')
  } else {
    console.log('  ✅ Bundle size looks good!')
  }
}

// Run analysis
analyzeBundleSize()

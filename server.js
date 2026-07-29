const express = require('express');
const cors = require('cors');
const path = require('path');
const { TMMCalculator } = require('./algorithms/tmm');
const { CropMatcher } = require('./algorithms/matcher');
const { AIAnalyzer } = require('./algorithms/analyzer');
const { cropDatabase } = require('./data/crops');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const tmmCalculator = new TMMCalculator();
const cropMatcher = new CropMatcher(cropDatabase);
const aiAnalyzer = new AIAnalyzer();

app.post('/api/calculate', async (req, res) => {
  try {
    const { layers, wavelengthRange, temperature } = req.body;
    
    if (!layers || !Array.isArray(layers)) {
      return res.status(400).json({ error: '无效的层结构数据' });
    }

    const results = tmmCalculator.calculate(layers, wavelengthRange || { start: 300, end: 2500, step: 10 }, temperature || 298.15);
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('计算错误:', error);
    res.status(500).json({ error: '计算失败: ' + error.message });
  }
});

app.post('/api/match/recommend', async (req, res) => {
  try {
    const { filmProperties, topN } = req.body;
    
    if (!filmProperties) {
      return res.status(400).json({ error: '缺少薄膜性能参数' });
    }

    const recommendations = cropMatcher.recommendCrops(filmProperties, topN || 5);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('推荐错误:', error);
    res.status(500).json({ error: '推荐失败: ' + error.message });
  }
});

app.post('/api/match/judge', async (req, res) => {
  try {
    const { filmProperties, cropId } = req.body;
    
    if (!filmProperties || !cropId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const judgement = cropMatcher.judgeCropSuitability(filmProperties, cropId);
    res.json({ success: true, data: judgement });
  } catch (error) {
    console.error('评估错误:', error);
    res.status(500).json({ error: '评估失败: ' + error.message });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { filmProperties, cropMatches, question } = req.body;
    
    const analysis = aiAnalyzer.analyze(filmProperties, cropMatches, question || null);
    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('分析错误:', error);
    res.status(500).json({ error: '分析失败: ' + error.message });
  }
});

app.get('/api/crops', async (req, res) => {
  try {
    res.json({ success: true, data: cropDatabase });
  } catch (error) {
    res.status(500).json({ error: '获取作物数据失败' });
  }
});

app.get('/api/materials', async (req, res) => {
  try {
    const materials = tmmCalculator.getMaterialDatabase();
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ error: '获取材料数据失败' });
  }
});

app.post('/api/generate-report', async (req, res) => {
  try {
    const { calculationResults, cropAnalysis, aiAnalysis } = req.body;
    const report = aiAnalyzer.generateReport(calculationResults, cropAnalysis, aiAnalysis);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('报告生成错误:', error);
    res.status(500).json({ error: '报告生成失败: ' + error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`复合薄膜性能计算系统已启动: http://localhost:${PORT}`);
});

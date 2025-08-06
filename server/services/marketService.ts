/**
 * Market Service - Core Business Logic
 * Handles market simulation, trends, and competitor analysis
 */

import { storage } from '../storage';
import { MarketData } from '@shared/schema';

export class MarketService {
  /**
   * Generate dynamic market data based on simulation parameters
   */
  static async generateMarketData(category: string): Promise<MarketData> {
    // Get existing market data
    const marketData = await storage.getMarketData();
    const existingData = marketData.find(m => m.category === category);
    
    // Generate random market fluctuations
    const randomFluctuation = () => Math.random() * 20 - 10; // -10% to +10%
    
    const currentDemand = existingData?.demandLevel || 50;
    const currentCompetition = existingData?.competitionLevel || 50;
    const currentPriceIndex = Number(existingData?.priceIndex || 1.00);
    
    // Calculate new values with some randomness but trending logic
    const newDemand = Math.max(0, Math.min(100, currentDemand + randomFluctuation()));
    const newCompetition = Math.max(0, Math.min(100, currentCompetition + randomFluctuation()));
    
    // Price index affected by demand and competition
    const demandEffect = (newDemand - 50) / 100; // -0.5 to +0.5
    const competitionEffect = (50 - newCompetition) / 100; // -0.5 to +0.5
    const newPriceIndex = Math.max(0.5, Math.min(2.0, 
      currentPriceIndex * (1 + demandEffect * 0.1 + competitionEffect * 0.1)
    ));
    
    // Determine trend direction
    let trendDirection: 'rising' | 'falling' | 'stable' = 'stable';
    if (newDemand > currentDemand + 5) trendDirection = 'rising';
    else if (newDemand < currentDemand - 5) trendDirection = 'falling';
    
    // Generate market events
    const marketEvents = this.generateMarketEvents(newDemand, newCompetition);
    
    // Update market data
    const updatedData = await storage.updateMarketData(category, {
      category,
      demandLevel: Math.round(newDemand),
      competitionLevel: Math.round(newCompetition),
      priceIndex: newPriceIndex.toFixed(2),
      trendDirection,
      marketEvents
    });
    
    return updatedData;
  }

  /**
   * Generate market events based on conditions
   */
  static generateMarketEvents(demand: number, competition: number): any[] {
    const events = [];
    
    if (demand > 80) {
      events.push({
        type: 'high_demand',
        title: '市场需求旺盛',
        description: '当前产品类别需求量大增，建议增加库存',
        impact: 'positive'
      });
    }
    
    if (demand < 20) {
      events.push({
        type: 'low_demand',
        title: '市场需求疲软',
        description: '消费者购买意愿降低，建议促销或减少采购',
        impact: 'negative'
      });
    }
    
    if (competition > 80) {
      events.push({
        type: 'high_competition',
        title: '竞争加剧',
        description: '新竞争对手进入市场，价格战可能发生',
        impact: 'negative'
      });
    }
    
    if (competition < 20) {
      events.push({
        type: 'low_competition',
        title: '竞争优势',
        description: '竞争对手减少，可以提高价格获取更多利润',
        impact: 'positive'
      });
    }
    
    // Random events
    if (Math.random() > 0.9) {
      events.push({
        type: 'seasonal',
        title: '季节性促销',
        description: '节日临近，消费需求预计增长30%',
        impact: 'positive'
      });
    }
    
    if (Math.random() > 0.95) {
      events.push({
        type: 'supply_disruption',
        title: '供应链中断',
        description: '主要供应商遇到问题，采购成本可能上升',
        impact: 'negative'
      });
    }
    
    return events;
  }

  /**
   * Analyze market trends and provide recommendations
   */
  static async analyzeMarketTrends(categories: string[]): Promise<any> {
    const analysis = {
      trends: [],
      recommendations: [],
      opportunities: [],
      risks: []
    };
    
    for (const category of categories) {
      const marketData = await this.generateMarketData(category);
      
      // Analyze trends
      analysis.trends.push({
        category,
        demand: marketData.demandLevel,
        competition: marketData.competitionLevel,
        priceIndex: marketData.priceIndex,
        trend: marketData.trendDirection,
        score: this.calculateMarketScore(marketData)
      });
      
      // Generate recommendations
      if (marketData.demandLevel > 70 && marketData.competitionLevel < 50) {
        analysis.opportunities.push({
          category,
          type: 'high_potential',
          message: `${category} 市场需求高且竞争较少，建议增加投入`
        });
        
        analysis.recommendations.push({
          category,
          action: 'increase_inventory',
          reason: '市场条件有利',
          expectedReturn: 25
        });
      }
      
      if (marketData.demandLevel < 30) {
        analysis.risks.push({
          category,
          type: 'low_demand',
          message: `${category} 需求低迷，建议减少库存`
        });
        
        analysis.recommendations.push({
          category,
          action: 'reduce_inventory',
          reason: '需求不足',
          expectedReturn: -10
        });
      }
      
      if (marketData.competitionLevel > 80) {
        analysis.risks.push({
          category,
          type: 'high_competition',
          message: `${category} 竞争激烈，利润率可能下降`
        });
        
        analysis.recommendations.push({
          category,
          action: 'price_adjustment',
          reason: '竞争压力',
          expectedReturn: 5
        });
      }
    }
    
    return analysis;
  }

  /**
   * Calculate market attractiveness score
   */
  static calculateMarketScore(marketData: MarketData): number {
    const demandScore = marketData.demandLevel / 100 * 40; // 40% weight
    const competitionScore = (100 - marketData.competitionLevel) / 100 * 30; // 30% weight
    const priceScore = Number(marketData.priceIndex) * 30; // 30% weight
    
    return Math.round(demandScore + competitionScore + priceScore);
  }

  /**
   * Simulate competitor behavior
   */
  static async simulateCompetitors(userId: string, taskId: string): Promise<any[]> {
    const competitors = [
      {
        id: 'comp1',
        name: '竞争对手A',
        strategy: 'aggressive',
        marketShare: 25,
        avgPrice: 0.9, // 90% of market price
        strength: '价格优势'
      },
      {
        id: 'comp2',
        name: '竞争对手B',
        strategy: 'quality',
        marketShare: 20,
        avgPrice: 1.2, // 120% of market price
        strength: '品质优势'
      },
      {
        id: 'comp3',
        name: '竞争对手C',
        strategy: 'balanced',
        marketShare: 15,
        avgPrice: 1.0, // Market price
        strength: '服务优势'
      }
    ];
    
    // Simulate competitor actions based on market conditions
    const marketData = await storage.getMarketData();
    const actions = [];
    
    for (const competitor of competitors) {
      const avgDemand = marketData.reduce((sum, m) => sum + m.demandLevel, 0) / marketData.length;
      
      if (competitor.strategy === 'aggressive' && avgDemand > 60) {
        actions.push({
          competitor: competitor.name,
          action: '降价促销',
          impact: '市场价格可能下降5-10%',
          response: '考虑提升服务质量或产品差异化'
        });
      }
      
      if (competitor.strategy === 'quality' && avgDemand > 70) {
        actions.push({
          competitor: competitor.name,
          action: '推出高端产品线',
          impact: '高端市场竞争加剧',
          response: '可以专注中低端市场或提升品质'
        });
      }
      
      if (competitor.strategy === 'balanced') {
        actions.push({
          competitor: competitor.name,
          action: '扩大市场份额',
          impact: '整体竞争加剧',
          response: '需要明确自身定位和优势'
        });
      }
    }
    
    return actions;
  }

  /**
   * Calculate optimal pricing based on market conditions
   */
  static async calculateOptimalPrice(
    productId: string,
    baseCost: number,
    targetMargin: number
  ): Promise<{
    recommendedPrice: number,
    minPrice: number,
    maxPrice: number,
    explanation: string
  }> {
    const product = await storage.getProduct(productId);
    if (!product) {
      throw new Error('产品不存在');
    }
    
    // Get market data for the product category
    const marketData = await storage.getMarketData();
    const categoryData = marketData.find(m => m.category === product.category) || marketData[0];
    
    const priceIndex = Number(categoryData?.priceIndex || 1.0);
    const demandLevel = categoryData?.demandLevel || 50;
    const competitionLevel = categoryData?.competitionLevel || 50;
    
    // Calculate base price with target margin
    const basePrice = baseCost * (1 + targetMargin);
    
    // Adjust for market conditions
    const demandMultiplier = 0.8 + (demandLevel / 100) * 0.4; // 0.8 to 1.2
    const competitionMultiplier = 1.2 - (competitionLevel / 100) * 0.4; // 0.8 to 1.2
    
    const recommendedPrice = basePrice * priceIndex * demandMultiplier * competitionMultiplier;
    const minPrice = baseCost * 1.1; // Minimum 10% margin
    const maxPrice = basePrice * 1.5; // Maximum 50% above target
    
    let explanation = '';
    if (demandLevel > 70) {
      explanation += '市场需求旺盛，可适当提高价格。';
    } else if (demandLevel < 30) {
      explanation += '市场需求低迷，建议降低价格刺激销售。';
    }
    
    if (competitionLevel > 70) {
      explanation += '竞争激烈，价格不宜过高。';
    } else if (competitionLevel < 30) {
      explanation += '竞争较少，有一定的定价空间。';
    }
    
    return {
      recommendedPrice: Math.round(recommendedPrice * 100) / 100,
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      explanation: explanation || '市场条件正常，按建议价格销售即可。'
    };
  }
}
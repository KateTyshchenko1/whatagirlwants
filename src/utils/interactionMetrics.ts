import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types/base";
import type { InteractionMetrics, MetricsJson, ConversationStyle } from "@/types/metrics";

export class MetricsManager {
  static async updateMetrics(
    userId: string,
    message: string,
    botResponse: string
  ): Promise<InteractionMetrics> {
    try {
      const metrics = this.analyzeInteraction(message, botResponse);
      
      const { data: profile } = await supabase
        .from('companion_profiles')
        .select('interaction_metrics')
        .eq('profile_id', userId)
        .single();

      if (!profile) throw new Error('Profile not found');

      const updatedMetrics = this.calculateNewMetrics(
        this.parseMetricsJson(profile.interaction_metrics),
        metrics
      );

      const metricsJson = this.convertToJson(updatedMetrics);

      await supabase
        .from('companion_profiles')
        .update({ 
          interaction_metrics: metricsJson,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', userId);

      return updatedMetrics;
    } catch (error) {
      console.error('Error updating metrics:', error);
      throw error;
    }
  }

  private static parseMetricsJson(json: unknown): InteractionMetrics | null {
    if (!json || typeof json !== 'object') return null;
    
    const metrics = json as Record<string, unknown>;
    if (!this.isValidMetricsJson(metrics)) return null;

    return {
      flirtLevel: Number(metrics.flirtLevel) || 0,
      charmFactor: Number(metrics.charmFactor) || 0,
      wittyExchanges: Number(metrics.wittyExchanges) || 0,
      energyLevel: String(metrics.energyLevel) as InteractionMetrics['energyLevel'],
      connectionStyle: String(metrics.connectionStyle) as ConversationStyle
    };
  }

  private static isValidMetricsJson(json: Record<string, unknown>): boolean {
    return 'flirtLevel' in json &&
           'charmFactor' in json &&
           'wittyExchanges' in json &&
           'energyLevel' in json &&
           'connectionStyle' in json;
  }

  private static convertToJson(metrics: InteractionMetrics): Record<string, Json> {
    return {
      flirtLevel: metrics.flirtLevel,
      charmFactor: metrics.charmFactor,
      wittyExchanges: metrics.wittyExchanges,
      energyLevel: metrics.energyLevel,
      connectionStyle: metrics.connectionStyle
    };
  }

  private static analyzeInteraction(
    userMessage: string,
    botResponse: string
  ): InteractionMetrics {
    const flirtIndicators = ['😊', '😉', '💕', 'haha', 'lol'];
    const wittyIndicators = ['clever', 'witty', 'joke'];
    
    return {
      flirtLevel: this.calculateFlirtLevel(userMessage, flirtIndicators),
      charmFactor: this.calculateCharmFactor(botResponse),
      wittyExchanges: this.countWittyExchanges(userMessage, botResponse, wittyIndicators),
      energyLevel: this.determineEnergyLevel(userMessage),
      connectionStyle: this.determineConnectionStyle(userMessage, botResponse)
    };
  }

  private static calculateFlirtLevel(message: string, indicators: string[]): number {
    const count = indicators.reduce((acc, indicator) => 
      acc + (message.toLowerCase().split(indicator.toLowerCase()).length - 1), 0);
    return Math.min(Math.round((count + 1) * 2), 10);
  }

  private static calculateCharmFactor(message: string): number {
    const wordCount = message.split(' ').length;
    const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(message);
    const hasPersonalReference = /(i|you|we|us)/i.test(message);
    
    let factor = 5; // Base level
    if (wordCount > 10) factor += 1;
    if (hasEmoji) factor += 2;
    if (hasPersonalReference) factor += 2;
    
    return Math.min(factor, 10);
  }

  private static countWittyExchanges(
    userMessage: string, 
    botResponse: string,
    indicators: string[]
  ): number {
    const combinedText = `${userMessage.toLowerCase()} ${botResponse.toLowerCase()}`;
    return indicators.reduce((acc, indicator) => 
      acc + (combinedText.split(indicator).length - 1), 0);
  }

  private static determineEnergyLevel(
    message: string
  ): InteractionMetrics['energyLevel'] {
    if (message.includes('!') || /[😄😊🎉✨]/.test(message)) return 'excited';
    if (/[💕💗🥰]/.test(message)) return 'romantic';
    if (message.length > 100 || /\?/.test(message)) return 'intellectual';
    if (/haha|lol|😂/.test(message.toLowerCase())) return 'playful';
    return 'chill';
  }

  private static determineConnectionStyle(
    userMessage: string,
    botResponse: string
  ): ConversationStyle {
    const combinedText = `${userMessage.toLowerCase()} ${botResponse.toLowerCase()}`;
    if (/[💕💗🥰]/.test(combinedText)) return 'charming';
    if (/\?|think|why|how/.test(combinedText)) return 'intellectual';
    if (/haha|lol|😂/.test(combinedText)) return 'playful';
    if (/😊|😉/.test(combinedText)) return 'flirty';
    return 'supportive';
  }

  private static calculateNewMetrics(
    currentMetrics: InteractionMetrics | null,
    newMetrics: InteractionMetrics
  ): InteractionMetrics {
    if (!currentMetrics) return newMetrics;
    
    return {
      flirtLevel: Math.round((currentMetrics.flirtLevel + newMetrics.flirtLevel) / 2),
      charmFactor: Math.round((currentMetrics.charmFactor + newMetrics.charmFactor) / 2),
      wittyExchanges: currentMetrics.wittyExchanges + newMetrics.wittyExchanges,
      energyLevel: newMetrics.energyLevel,
      connectionStyle: newMetrics.connectionStyle
    };
  }
}
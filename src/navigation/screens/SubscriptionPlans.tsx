import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  getUserPlan,
  UserSubscription,
  isUnlimitedPlan,
} from '../../services/planService';
import RevenueCatService, {
  type Offerings,
  type PurchasesPackage,
} from '../../services/revenueCatService';
import { PLANS, Plan, BillingPeriod } from '../../constants/planLimits';

export default function SubscriptionPlans() {
  const { t } = useTranslation();

  const [planData, setPlanData] = useState<UserSubscription | null>(null);
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('free');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [userPlan, rcOfferings] = await Promise.all([
        getUserPlan(),
        RevenueCatService.getInstance().getOfferings(),
      ]);
      setPlanData(userPlan);
      setOfferings(rcOfferings);

      if (userPlan?.effective_plan) {
        setSelectedPlanId(userPlan.effective_plan);
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePurchase = useCallback(
    async (plan: Plan, period: BillingPeriod) => {
      if (plan.id === 'free') return;

      const productId = plan.getProductId(period);
      if (!productId || !offerings) {
        Alert.alert(
          t('common.messages.error', 'Errore'),
          t('subscriptionPlans.offlineError', 'Servizio offline o piano non disponibile.')
        );
        return;
      }

      try {
        setActionLoading(true);

        const packageToPurchase = offerings.current?.availablePackages.find(
          (pkg) => pkg.product.identifier === productId
        );

        if (!packageToPurchase) {
          Alert.alert(t('subscriptionPlans.unavailable', 'Non disponibile al momento.'));
          return;
        }

        await RevenueCatService.getInstance().purchasePlan(packageToPurchase);
        await loadData();
        Alert.alert(t('subscriptionPlans.purchaseSuccess', 'Acquisto completato con successo!'));
      } catch (error: any) {
        if (error?.userCancelled) {
          return;
        }
        Alert.alert(
          t('subscriptionPlans.purchaseError', 'Errore durante l\'acquisto'),
          error?.message || t('common.messages.error', 'Si è verificato un errore sconosciuto.')
        );
      } finally {
        setActionLoading(false);
      }
    },
    [offerings, t, loadData]
  );

  const isCurrentPlan = useCallback(
    (planId: string): boolean => {
      return planData?.effective_plan === planId;
    },
    [planData]
  );

  const formatFeatureLimit = (daily: number | string, monthly: number | string) => {
    const d = isUnlimitedPlan(daily) ? '∞' : String(daily);
    const m = isUnlimitedPlan(monthly) ? '∞' : String(monthly);
    return `${d} ${t('common.daily', 'giornalieri')} • ${m} ${t('common.monthly', 'mensili')}`;
  };

  // Find the package for the selected plan + billing period
  const findPackage = useCallback(
    (plan: Plan, period: BillingPeriod): PurchasesPackage | undefined => {
      const productId = plan.getProductId(period);
      if (!productId || !offerings) return undefined;
      return offerings.current?.availablePackages.find(
        (p) => p.product.identifier === productId
      );
    },
    [offerings]
  );

  // Calculate annual savings percentage
  const calcAnnualSavings = useCallback(
    (plan: Plan): number | null => {
      const monthlyPkg = findPackage(plan, 'monthly');
      const annualPkg = findPackage(plan, 'annual');
      if (!monthlyPkg || !annualPkg) return null;

      const monthlyCostPerYear = monthlyPkg.product.price * 12;
      const annualCost = annualPkg.product.price;
      if (monthlyCostPerYear === 0) return null;

      return Math.round(((monthlyCostPerYear - annualCost) / monthlyCostPerYear) * 100);
    },
    [findPackage]
  );

  const plansArray = Object.values(PLANS);
  const selectedPlan = PLANS[selectedPlanId as keyof typeof PLANS] || PLANS.free;
  const isSelectedPlanCurrent = isCurrentPlan(selectedPlan.id);
  const isFreeSelected = selectedPlan.id === 'free';

  const pkg = findPackage(selectedPlan, billingPeriod);
  const savings = billingPeriod === 'annual' ? calcAnnualSavings(selectedPlan) : null;

  const monthlyEquivPrice = useMemo(() => {
    if (billingPeriod !== 'annual' || !pkg) return null;
    return pkg.product.price / 12;
  }, [billingPeriod, pkg]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C1C1E" />
        </View>
      </SafeAreaView>
    );
  }

  let priceStr = isFreeSelected ? t('common.free', 'Free') : '—';
  let subtitleStr = t('subscriptionPlans.freeDescription', 'Just the basics');
  let trialInfo: string | null = null;

  if (!isFreeSelected) {
    if (pkg) {
      priceStr = pkg.product.priceString;
      subtitleStr = pkg.product.description || t('subscriptionPlans.premiumDesc', 'Unlock all premium features');

      // Check for introductory price (free trial)
      const intro = pkg.product.introductoryPrice;
      if (intro) {
        trialInfo = t('subscriptionPlans.freeTrial', 'Free trial');
      }

      if (billingPeriod === 'annual' && monthlyEquivPrice !== null) {
        const currency = pkg.product.priceString.replace(/[\d.,\s]/g, '').trim();
        const formatted = monthlyEquivPrice.toFixed(2).replace('.', ',');
        priceStr = `${currency}${formatted}`;
        subtitleStr = t('subscriptionPlans.perMonth', '/month') + ' — ' + t('subscriptionPlans.annual', 'Annual');
      }
    } else {
      subtitleStr = t('subscriptionPlans.offlineDescription', 'Dettagli non disponibili al momento.');
    }
  }

  const offlineOrMissing = !isFreeSelected && !pkg;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* Title + Billing Toggle */}
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>{t('subscriptionPlans.selectPlan', 'Select plan')}</Text>
          {!isFreeSelected && (
            <View style={styles.billingToggle}>
              <TouchableOpacity
                style={[styles.billingOption, billingPeriod === 'monthly' && styles.billingOptionActive]}
                onPress={() => setBillingPeriod('monthly')}
              >
                <Text style={[styles.billingOptionText, billingPeriod === 'monthly' && styles.billingOptionTextActive]}>
                  {t('subscriptionPlans.monthly', 'Monthly')}
                </Text>
              </TouchableOpacity>
              <View style={styles.annualOptionWrapper}>
                {savings !== null && savings > 0 && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsBadgeText}>
                      {savings}% off
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.billingOption, billingPeriod === 'annual' && styles.billingOptionActive]}
                  onPress={() => setBillingPeriod('annual')}
                >
                  <Text style={[styles.billingOptionText, billingPeriod === 'annual' && styles.billingOptionTextActive]}>
                    {t('subscriptionPlans.annual', 'Annual')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Warning Banner */}
        {!loading && !offerings && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={20} color="#856404" />
            <Text style={styles.warningText}>
              {t('subscriptionPlans.offlineWarning', 'Offline. Prezzi non disponibili.')}
            </Text>
          </View>
        )}

        {/* Plan Tabs */}
        <View style={styles.tabsContainer}>
          {plansArray.map((p) => {
            const isActive = p.id === selectedPlanId;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setSelectedPlanId(p.id)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dark Plan Header Card */}
        <View style={styles.darkCard}>
          <View style={styles.darkCardHeader}>
            <Text style={styles.darkCardTitle}>{pkg?.product.title || selectedPlan.name}</Text>
            {isSelectedPlanCurrent && (
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark" size={14} color="#1C1C1E" />
                <Text style={styles.activeBadgeText}>{t('subscriptionPlans.active', 'Active')}</Text>
              </View>
            )}
          </View>

          {/* Free Trial Badge */}
          {trialInfo && !isSelectedPlanCurrent && (
            <View style={styles.trialBadge}>
              <Ionicons name="gift-outline" size={16} color="#34C759" />
              <Text style={styles.trialBadgeText}>{trialInfo}</Text>
            </View>
          )}

          <Text style={styles.darkCardPrice}>{priceStr}</Text>
          <Text style={styles.darkCardSubtitle}>{subtitleStr}</Text>
        </View>

        {/* Features Section */}
        <Text style={styles.sectionTitle}>{t('subscriptionPlans.topFeatures', 'Top features')}</Text>

        <View style={styles.featuresCard}>

          <FeatureItem
            icon="chatbubbles"
            title={t('subscriptionPlans.featTextTitle', 'Text Chats')}
            description={t('subscriptionPlans.featTextDesc', 'Include {{limits}}', {
              limits: formatFeatureLimit(selectedPlan.limits.chatTextDaily, selectedPlan.limits.chatTextMonthly)
            })}
          />

          <FeatureItem
            icon="mic"
            title={t('subscriptionPlans.featVoiceTitle', 'Voice Interactions')}
            description={t('subscriptionPlans.featVoiceDesc', 'Include {{limits}}', {
              limits: formatFeatureLimit(selectedPlan.limits.chatVoiceDaily, selectedPlan.limits.chatVoiceMonthly)
            })}
          />

          <FeatureItem
            icon="sparkles"
            title={t('subscriptionPlans.featAiTitle', 'AI Intelligence')}
            description={t('subscriptionPlans.featAiDesc', 'Powered by {{model}} model for accurate responses', {
              model: selectedPlan.limits.aiModel.toUpperCase()
            })}
          />

          <FeatureItem
            icon="folder"
            title={t('subscriptionPlans.featCategoriesTitle', 'Organization')}
            description={t('subscriptionPlans.featCategoriesDesc', 'Organize tasks in up to {{count}} categories', {
              count: isUnlimitedPlan(selectedPlan.limits.maxCategories) ? 'unlimited' : String(selectedPlan.limits.maxCategories)
            })}
            isLast
          />

        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Action Button Fixed */}
      <View style={styles.bottomActionContainer}>
        <TouchableOpacity
          style={[
            styles.mainButton,
            (isSelectedPlanCurrent || actionLoading || offlineOrMissing) && styles.mainButtonDisabled
          ]}
          onPress={() => handlePurchase(selectedPlan, billingPeriod)}
          disabled={isSelectedPlanCurrent || actionLoading || offlineOrMissing || isFreeSelected}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={[
              styles.mainButtonText,
              (isSelectedPlanCurrent || actionLoading || offlineOrMissing) && styles.mainButtonTextDisabled
            ]}>
              {isSelectedPlanCurrent
                ? t('subscriptionPlans.currentPlan', 'Current Plan')
                : offlineOrMissing
                ? t('subscriptionPlans.unavailable', 'Unavailable')
                : isFreeSelected
                ? t('subscriptionPlans.currentPlan', 'Current Plan')
                : t('subscriptionPlans.getPlan', 'Get {{plan}}', { plan: selectedPlan.name })}
            </Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

function FeatureItem({ icon, title, description, isLast }: { icon: keyof typeof Ionicons.glyphMap, title: string, description: string, isLast?: boolean }) {
  return (
    <View style={[styles.featureItemContainer, !isLast && styles.featureItemBorder]}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={22} color="#1C1C1E" />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#1C1C1E',
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 3,
  },
  billingOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  billingOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  billingOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  billingOptionTextActive: {
    color: '#1C1C1E',
  },
  savingsBadge: {
    backgroundColor: '#34C759',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    position: 'absolute',
    top: -8,
    right: -4,
    zIndex: 1,
  },
  savingsBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  annualOptionWrapper: {
    position: 'relative',
  },
  darkCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  darkCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  darkCardTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  activeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    marginLeft: 4,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  trialBadgeText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  darkCardPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  darkCardSubtitle: {
    fontSize: 15,
    color: '#A1A1A6',
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  featureItemContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
  },
  featureItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  featureIconContainer: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  featureDescription: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
  bottomActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: '#F7F7F9',
  },
  mainButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 100,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  mainButtonDisabled: {
    backgroundColor: '#E5E5EA',
    shadowOpacity: 0,
    elevation: 0,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  mainButtonTextDisabled: {
    color: '#8E8E93',
  },
});

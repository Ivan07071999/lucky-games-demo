export type PaytableLayout = {
  columns: number;
  gap: number;
  iconSize: number;
  cardHeight: number;
  wagerFontSize: number;
  explanationFontSize: number;
  nameFontSize: number;
  payoutFontSize: number;
  payoutGap: number;
  headerGap: number;
  contentGap: number;
  featureGap: number;
  featureTopGap: number;
  dividerOffset: number;
  featureHorizontal: boolean;
  featureIconSize: number;
  featureTitleFontSize: number;
  featureDescriptionFontSize: number;
  featureTextGap: number;
  featureDescriptionGap: number;
  featureBottomGap: number;
  pageBottomGap: number;
};

const PAYTABLE_LAYOUTS: { compact: PaytableLayout; medium: PaytableLayout; wide: PaytableLayout } =
  {
    compact: {
      columns: 2,
      gap: 8,
      iconSize: 50,
      cardHeight: 120,
      wagerFontSize: 14,
      explanationFontSize: 12,
      nameFontSize: 13,
      payoutFontSize: 12,
      payoutGap: 21,
      headerGap: 4,
      contentGap: 10,
      featureGap: 12,
      featureTopGap: 14,
      dividerOffset: 8,
      featureHorizontal: false,
      featureIconSize: 50,
      featureTitleFontSize: 13,
      featureDescriptionFontSize: 12,
      featureTextGap: 10,
      featureDescriptionGap: 3,
      featureBottomGap: 4,
      pageBottomGap: 8,
    },
    medium: {
      columns: 3,
      gap: 14,
      iconSize: 68,
      cardHeight: 146,
      wagerFontSize: 16,
      explanationFontSize: 14,
      nameFontSize: 15,
      payoutFontSize: 14,
      payoutGap: 24,
      headerGap: 5,
      contentGap: 12,
      featureGap: 18,
      featureTopGap: 18,
      dividerOffset: 10,
      featureHorizontal: true,
      featureIconSize: 64,
      featureTitleFontSize: 15,
      featureDescriptionFontSize: 13,
      featureTextGap: 10,
      featureDescriptionGap: 3,
      featureBottomGap: 4,
      pageBottomGap: 8,
    },
    wide: {
      columns: 4,
      gap: 20,
      iconSize: 88,
      cardHeight: 176,
      wagerFontSize: 19,
      explanationFontSize: 15,
      nameFontSize: 17,
      payoutFontSize: 16,
      payoutGap: 26,
      headerGap: 4,
      contentGap: 10,
      featureGap: 24,
      featureTopGap: 22,
      dividerOffset: 12,
      featureHorizontal: true,
      featureIconSize: 72,
      featureTitleFontSize: 17,
      featureDescriptionFontSize: 15,
      featureTextGap: 10,
      featureDescriptionGap: 3,
      featureBottomGap: 4,
      pageBottomGap: 8,
    },
  };

export const getPaytableLayout = (width: number): PaytableLayout => {
  if (width < 480) return PAYTABLE_LAYOUTS.compact;
  if (width < 760) return PAYTABLE_LAYOUTS.medium;
  return PAYTABLE_LAYOUTS.wide;
};

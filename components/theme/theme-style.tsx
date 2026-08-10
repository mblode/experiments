import { getDefaultPageTheme } from "@/components/theme/theme.utils";
import type { VenueThemeSchema } from "@/lib/types";

interface Props {
  content: Partial<VenueThemeSchema> | undefined;
}

const getFontData = (content?: Partial<VenueThemeSchema>) => {
  const getFontVariable = (fontFamily: string | undefined) => {
    return fontFamily;
  };

  const fontData = `
    --page-heading-font-family: ${getFontVariable(content?.headingFontFamily)};
    --page-body-font-family: ${getFontVariable(content?.bodyFontFamily)};
  `;

  return { fontData };
};

export const ThemeStyle = ({ content: defaultContent }: Props) => {
  const content = getDefaultPageTheme(defaultContent);
  const { fontData } = getFontData(content);

  const backgroundColor1 = content?.media?.color;
  const backgroundColor2 = content?.media?.backgroundColor2;

  return (
    <>
      <style>
        {`
      :root {
        --page-background-color: ${backgroundColor1};
        --page-background-2: ${backgroundColor2 || backgroundColor1};

        --page-text-color: ${content?.textColor};
        --page-widget-border-color: ${content?.widgetBorderColor};
        --page-primary-button-text-color: ${content?.primaryButtonTextColor};
        --page-primary-button-border-color: ${content?.primaryButtonBorderColor};
        --page-secondary-button-text-color: ${content?.secondaryButtonTextColor};
        --page-secondary-button-border-color: ${content?.secondaryButtonBorderColor};
        --page-divider-color: ${content?.dividerColor};
        --page-heading-text-color: ${content?.headingTextColor};
        --page-body-text-color: ${content?.bodyTextColor};
        --page-body-muted-text-color: ${content?.bodyMutedTextColor};
        --page-icon-color: ${content?.iconColor};
        --page-icon-box-border-color: ${content?.iconBoxBorderColor};
        --page-input-placeholder-color: ${content?.inputPlaceholderColor};
        --page-input-border-color: ${content?.inputBorderColor};
        --page-input-text-color: ${content?.inputTextColor};
        --page-input-icon-color: ${content?.inputIconColor};
        --page-card-text-color: ${content?.cardTextColor};
        --page-card-border-color: ${content?.cardBorderColor};
        --page-card-icon-color: ${content?.cardIconColor};

        --page-widget-background: ${content?.widgetBackground};
        --page-input-background: ${content?.inputBackground};
        --page-primary-button-background: ${content?.primaryButtonBackground};
        --page-secondary-button-background: ${content?.secondaryButtonBackground};
        --page-icon-box-background: ${content?.iconBoxBackground};
        --page-card-background: ${content?.cardBackground};
        --page-card-secondary-background: ${content?.cardSecondaryBackground};

        --page-widget-border-radius: ${content?.widgetBorderRadius}px;

        --page-widget-border-width: ${content?.widgetBorderWidth}px;
        --page-primary-button-border-width: ${content?.primaryButtonBorderWidth}px;
        --page-secondary-button-border-width: ${content?.secondaryButtonBorderWidth}px;
        --page-input-border-width: ${content?.inputBorderWidth}px;
        --page-card-border-width: ${content?.cardBorderWidth}px;
        --page-icon-box-border-width: ${content?.iconBoxBorderWidth}px;

        --page-widget-shadow: ${content?.widgetShadow};
        --page-primary-button-shadow: ${content?.primaryButtonShadow};
        --page-secondary-button-shadow: ${content?.secondaryButtonShadow};
        --page-card-shadow: ${content?.cardShadow};
        --page-icon-box-shadow: ${content?.iconBoxShadow};
        --page-input-shadow: ${content?.inputShadow};

        --page-widget-backdrop-blur: ${content?.widgetBackdropBlur};
        --page-primary-button-backdrop-blur: ${content?.primaryButtonBackdropBlur};
        --page-secondary-button-backdrop-blur: ${content?.secondaryButtonBackdropBlur};
        --page-card-backdrop-blur: ${content?.cardBackdropBlur};

        --page-heading-font-weight: ${content?.headingFontWeight};
        --page-body-font-weight: ${content?.bodyFontWeight};
        --page-primary-button-font-weight: ${content?.primaryButtonFontWeight || content?.bodyFontWeight};
        --page-secondary-button-font-weight: ${content?.secondaryButtonFontWeight || content?.bodyFontWeight};

        ${fontData}

        ${content?.css}
      }
      `}
      </style>
      {content?.html && (
        <div dangerouslySetInnerHTML={{ __html: content.html }} />
      )}
    </>
  );
};

-- Add extended site content fields to HomepageContent
ALTER TABLE "HomepageContent"
  ADD COLUMN "siteName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "siteAdminTitle" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "siteAdminSubtitle" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "siteBackToHomeLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "siteLogoUrl" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "heroImageUrl" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "articleBackLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "articleUpdatedLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "articlePublishedLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "categoryHeaderLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "categoryEmptyLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "loginUsernameLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "loginUsernamePlaceholder" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "loginPasswordLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "loginPasswordPlaceholder" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "loginSignInButtonLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "loginSigningInLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "loginSessionExpiredMessage" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "loginInvalidCredentialsMessage" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "loginSuccessMessage" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "loginLoadingMessage" TEXT NOT NULL DEFAULT '';

-- Seed new fields with sensible defaults for existing locales
UPDATE "HomepageContent"
SET
  "siteName" = 'CCJM Homesteading',
  "siteAdminTitle" = 'CCJM Homesteading Admin',
  "siteAdminSubtitle" = 'Sign in to manage articles, categories, and homepage copy.',
  "siteBackToHomeLabel" = 'Back to homestead',
  "siteLogoUrl" = '/favicon.ico',
  "heroImageUrl" = '',
  "articleBackLabel" = '← Back to all stories',
  "articleUpdatedLabel" = 'Updated',
  "articlePublishedLabel" = 'Published',
  "categoryHeaderLabel" = 'Homestead topic',
  "categoryEmptyLabel" = 'No published articles in this category yet. Check back soon!',
  "loginUsernameLabel" = 'Username',
  "loginUsernamePlaceholder" = 'Enter your username',
  "loginPasswordLabel" = 'Password',
  "loginPasswordPlaceholder" = 'Enter your password',
  "loginSignInButtonLabel" = 'Sign in',
  "loginSigningInLabel" = 'Signing in...',
  "loginSessionExpiredMessage" = 'Your session has expired. Please sign in again.',
  "loginInvalidCredentialsMessage" = 'Invalid username or password.',
  "loginSuccessMessage" = 'Account created. You can sign in now.',
  "loginLoadingMessage" = 'Loading form…'
WHERE "locale" = 'en';

UPDATE "HomepageContent"
SET
  "siteName" = 'CCJM Homesteading',
  "siteAdminTitle" = 'CCJM Homesteading Beheer',
  "siteAdminSubtitle" = 'Meld je aan om artikelen, categorieën en de homepage bij te werken.',
  "siteBackToHomeLabel" = 'Terug naar de homestead',
  "siteLogoUrl" = '/favicon.ico',
  "heroImageUrl" = '',
  "articleBackLabel" = '← Terug naar alle verhalen',
  "articleUpdatedLabel" = 'Bijgewerkt',
  "articlePublishedLabel" = 'Gepubliceerd',
  "categoryHeaderLabel" = 'Boerderij onderwerp',
  "categoryEmptyLabel" = 'Nog geen verhalen in deze categorie. Kom later terug!',
  "loginUsernameLabel" = 'Gebruikersnaam',
  "loginUsernamePlaceholder" = 'Voer je gebruikersnaam in',
  "loginPasswordLabel" = 'Wachtwoord',
  "loginPasswordPlaceholder" = 'Voer je wachtwoord in',
  "loginSignInButtonLabel" = 'Inloggen',
  "loginSigningInLabel" = 'Bezig met inloggen...',
  "loginSessionExpiredMessage" = 'Je sessie is verlopen. Log opnieuw in.',
  "loginInvalidCredentialsMessage" = 'Ongeldige gebruikersnaam of wachtwoord.',
  "loginSuccessMessage" = 'Account aangemaakt. Je kunt nu inloggen.',
  "loginLoadingMessage" = 'Formulier laden…'
WHERE "locale" = 'nl';

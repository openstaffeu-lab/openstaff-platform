# EXEC-69B OTP Standardization

Date: 2026-05-25

## Standard

All email OTP challenge/setup codes are exactly six numeric digits.

Backend enforcement:

- `VerifyTwoFactorChallengeDto.code` uses `^\d{6}$`.
- `VerifyTwoFactorSetupDto.code` uses `^\d{6}$`.
- `generateOtpCode()` uses `randomInt(0, 1_000_000).toString().padStart(6, "0")`.

Frontend enforcement:

- Public `/two-factor` strips non-digits and limits input to six digits.
- Backoffice `/two-factor` strips non-digits and limits input to six digits.
- Public `/security` setup confirmation strips non-digits and limits input to six digits.
- Form submission rejects values that do not match six digits.

## Recovery Codes

Recovery codes remain generated and stored separately as hashed `XXXX-XXXX` backup codes. They are visible only at setup/regeneration time and are summarized in backoffice by remaining count, not plaintext value.

The login OTP endpoint now validates OTP shape at the DTO layer. A future enhancement should add an explicit recovery-code verification endpoint/UI if backup-code sign-in is required through the login challenge.


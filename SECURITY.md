# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.2.x   | ✅ |
| 0.1.x   | ❌ |

Security fixes land on the latest minor. Please upgrade to the latest release before reporting an issue.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please report privately using one of these channels:

1. **GitHub Security Advisories** (preferred):
   [https://github.com/terzigolu/react-native-advanced-date-picker/security/advisories/new](https://github.com/terzigolu/react-native-advanced-date-picker/security/advisories/new)
2. **Email**: `terziogluyusuff1@gmail.com` with subject `[react-native-advanced-date-picker security]`

Please include:
- A short description of the issue and the affected version(s)
- Steps to reproduce (a minimal snippet or repo is ideal)
- The impact you observed (crash, data leakage, RCE potential, etc.)
- Any proposed mitigation, if you have one

### What to expect

- **Acknowledgement** within 3 business days.
- **Initial assessment** within 7 business days — we'll either confirm the issue, ask for more info, or explain why it isn't in scope.
- **Fix timeline** depends on severity. Critical issues ship as a patch release ASAP; lower-severity ones go into the next minor.
- **Disclosure**: once a fix is released, we'll publish a GitHub Security Advisory crediting the reporter (unless you request anonymity).

## Out of scope

- Issues that only affect the demo app under `DatePickerTestApp/` (not published, not used by consumers).
- Social-engineering vectors against the maintainer's machine.
- Theoretical vulnerabilities without a practical reproduction.

Thanks for helping keep the ecosystem safe.

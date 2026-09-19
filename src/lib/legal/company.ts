// Section 43 of the Electronic Communications and Transactions Act 25 of 2002
// obliges an online supplier to publish its legal name, registration number,
// physical address, telephone number and email. Payment gateways check for the
// same set during merchant verification, because the card schemes require it.
//
// These are facts about Kwry (Pty) Ltd, not copy. They live here so the ToS,
// the contact page and the footer state one version of them.
//
// An empty string renders as nothing rather than as a placeholder. A published
// placeholder reads worse to a compliance reviewer than a missing line.

export const COMPANY = {
  legalName: 'Kwry (Pty) Ltd',
  tradingAs: 'Stallspace',

  /** CIPC registration number, format 2024/123456/07. */
  registrationNumber: '',

  /** Street address. A PO box does not satisfy ECTA s43(1)(c). */
  physicalAddress: '',

  /** Published contact number, international format. */
  telephone: '',

  /**
   * POPIA makes the head of a private body its Information Officer by
   * operation of law. A data subject cannot address a section 23 request to
   * an unnamed person, so the name has to be published.
   */
  informationOfficer: '',

  email: 'hello@stallspace.co.za',
  supportEmail: 'support@stallspace.co.za',
  website: 'https://stallspace.co.za',
  country: 'South Africa',

  /** Currency every price on the marketplace is quoted in. */
  currency: 'ZAR',
} as const

/** Ordered lines for the entity block, skipping anything not yet supplied. */
export function companyDisclosureLines(): string[] {
  return [
    COMPANY.legalName + ' trading as ' + COMPANY.tradingAs,
    'A private company registered in the Republic of South Africa',
    COMPANY.registrationNumber
      ? 'Registration number ' + COMPANY.registrationNumber
      : '',
    COMPANY.physicalAddress,
    COMPANY.telephone ? 'Telephone ' + COMPANY.telephone : '',
    COMPANY.email,
    COMPANY.country,
  ].filter(Boolean)
}

/**
 * Emergency detection and safety protocols
 * PWS 3.1.15: Emergency Response and User Safety
 */

export interface SafetyCheck {
  isEmergency: boolean;
  category: 'self_harm' | 'violence' | 'medical' | 'crisis' | null;
  response: string | null;
}

const SELF_HARM_PATTERNS = [
  /\b(suicid|kill\s*(my|him|her)?self|end\s*(my|it|life)|want\s*to\s*die|don'?t\s*want\s*to\s*live)\b/i,
  /\b(self[- ]?harm|cut(ting)?\s*(my)?self|hurt(ing)?\s*(my)?self)\b/i,
  /\b(overdose|taking\s*pills|swallow\s*pills)\b/i,
];

const VIOLENCE_PATTERNS = [
  /\b(threat(en)?|attack|bomb|weapon|gun|shoot|stab|assault)\b/i,
  /\b(hurt\s*(someone|people|them|him|her)|going\s*to\s*harm)\b/i,
];

const MEDICAL_PATTERNS = [
  /\b(medical\s*emergency|can'?t\s*breathe|chest\s*pain|heart\s*attack|stroke|seizure|unconscious|bleeding\s*(heavily|profusely))\b/i,
  /\b(anaphyla|allergic\s*reaction|choking)\b/i,
];

const CRISIS_PATTERNS = [
  /\b(in\s*danger|being\s*(follow|stalk|threat)|help\s*me|emergency|kidnap|traffick)\b/i,
  /\b(abus(e|ed|ing)|domestic\s*violence|sexual\s*assault)\b/i,
];

const EMERGENCY_RESOURCES = {
  self_harm: `I'm concerned about what you've shared. You're not alone, and help is available right now.

**If you're in immediate danger, please call 911.**

**988 Suicide & Crisis Lifeline**: Call or text **988** (available 24/7)
**Crisis Text Line**: Text **HOME** to **741741**
**Veterans Crisis Line**: Call **988**, then press **1**

These services are free, confidential, and available 24/7. A trained counselor is ready to help.

If you're a Peace Corps Volunteer or applicant experiencing a crisis, please also contact your Peace Corps Medical Officer (PCMO) or the Peace Corps Office of Health Services.`,

  violence: `If you or someone else is in immediate danger, please call **911** right away.

**National Domestic Violence Hotline**: 1-800-799-7233
**National Sexual Assault Hotline**: 1-800-656-4673

If this is related to a Peace Corps service situation, please contact the Peace Corps Office of Safety and Security immediately.`,

  medical: `If this is a medical emergency, please call **911** immediately.

If you're a Peace Corps Volunteer, contact your **Peace Corps Medical Officer (PCMO)** immediately. The Peace Corps Office of Health Services can be reached 24/7.

**Poison Control**: 1-800-222-1222`,

  crisis: `If you're in immediate danger, please call **911**.

**National Domestic Violence Hotline**: 1-800-799-7233
**National Human Trafficking Hotline**: 1-888-373-7888
**National Sexual Assault Hotline**: 1-800-656-4673

If you're a Peace Corps Volunteer, please contact the **Peace Corps Office of Safety and Security** or your **Country Director** immediately.

You can also request to speak with a Peace Corps staff member right now by clicking "Talk to a Person" below.`,
};

export function checkSafety(message: string): SafetyCheck {
  const text = message.toLowerCase();

  for (const pattern of SELF_HARM_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isEmergency: true,
        category: 'self_harm',
        response: EMERGENCY_RESOURCES.self_harm,
      };
    }
  }

  for (const pattern of MEDICAL_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isEmergency: true,
        category: 'medical',
        response: EMERGENCY_RESOURCES.medical,
      };
    }
  }

  for (const pattern of VIOLENCE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isEmergency: true,
        category: 'violence',
        response: EMERGENCY_RESOURCES.violence,
      };
    }
  }

  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isEmergency: true,
        category: 'crisis',
        response: EMERGENCY_RESOURCES.crisis,
      };
    }
  }

  return { isEmergency: false, category: null, response: null };
}

/**
 * Check if a message contains HIPAA-protected information
 * PWS 3.1.23: HIPAA compliance
 */
export function checkHIPAA(message: string): boolean {
  const hipaaPatterns = [
    /\b(medical\s*record|diagnosis|prescription|medication|treatment\s*plan|health\s*condition|disability|mental\s*health\s*diagnosis)\b/i,
    /\b(ssn|social\s*security|insurance\s*(number|id)|patient\s*(id|number))\b/i,
    /\b(blood\s*type|hiv|std|pregnant|pregnancy\s*test|drug\s*test\s*result)\b/i,
  ];

  return hipaaPatterns.some(p => p.test(message));
}

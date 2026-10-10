export interface Question {
  prompt: string;
  choices: string[];
  correct: number;
  explanation: string;
}

export interface Procedure {
  id: string;
  title: string;
  category: string;
  description: string;
  situation: string;
  patient: {
    name: string;
    age: string;
    diagnosis: string;
    status: string;
    detail: string;
  };
  questions: Question[];
}

export const procedures: Procedure[] = [
  {
    id: 'ngt',
    title: 'NGT Tube Feeding',
    category: 'Fundamentals',
    description:
      'Practice safe preparation, placement checks, and patient monitoring.',
    situation:
      'You are assigned to administer tube feeding to a conscious adult patient with an existing nasogastric tube.',
    patient: {
      name: 'Juan Dela Cruz',
      age: '42 years old',
      diagnosis: 'Pneumonia',
      status: 'Conscious and oriented',
      detail: 'Tube size: 14 Fr (NGT)',
    },
    questions: [
      {
        prompt:
          'Before touching the patient or equipment, what should you do first?',
        choices: [
          'Start the prescribed feeding.',
          'Perform hand hygiene.',
          'Flush the nasogastric tube.',
        ],
        correct: 1,
        explanation:
          'Perform hand hygiene before patient contact or handling equipment. Then identify the patient and continue the required safety checks. Gloves do not replace hand hygiene.',
      },
      {
        prompt: 'How should you confirm that you have the correct patient?',
        choices: [
          'Ask the patient to state two approved identifiers and compare them with the record.',
          'Use the room number on the door.',
          'Ask whether the patient recognizes you.',
        ],
        correct: 0,
        explanation:
          'Use at least two approved patient identifiers, such as the patient’s name and date of birth, according to local policy. A room or bed number is not a patient identifier.',
      },
      {
        prompt:
          'Unless contraindicated, how should you position the patient for feeding?',
        choices: [
          'Flat on their back.',
          'With their feet raised above their head.',
          'With the head of the bed elevated at least 30–45 degrees.',
        ],
        correct: 2,
        explanation:
          'Head-of-bed elevation helps reduce aspiration risk. Follow the prescribed positioning and local enteral-feeding policy, and keep the patient appropriately elevated during and after feeding.',
      },
      {
        prompt:
          'The tube’s position has not been verified as required by policy. What is the safest action?',
        choices: [
          'Begin feeding if the patient has no discomfort.',
          'Withhold feeding and have placement verified using the approved protocol.',
          'Inject air and rely only on the sound heard over the stomach.',
        ],
        correct: 1,
        explanation:
          'Do not use a tube whose placement has not been confirmed as required. Follow the approved placement-verification protocol and escalate uncertainty. Air insufflation with auscultation alone is not reliable.',
      },
      {
        prompt:
          'During feeding, the patient develops coughing and breathing difficulty. What should you do?',
        choices: [
          'Stop the feeding, assess the patient, and seek urgent clinical help as needed.',
          'Increase the flow rate to finish sooner.',
          'Give water through the tube and continue.',
        ],
        correct: 0,
        explanation:
          'Stop feeding and promptly assess airway, breathing, and the patient’s condition. Activate the appropriate escalation or emergency response according to severity and local policy.',
      },
      {
        prompt: 'After a feeding is safely completed, what should you record?',
        choices: [
          'Only that the tube is still present.',
          'Nothing if the patient feels comfortable.',
          'The feeding and prescribed flushes, tolerance, relevant assessments, and any concerns or actions.',
        ],
        correct: 2,
        explanation:
          'Document the prescribed feeding and flushes, patient tolerance, relevant assessments, and any concerns or actions taken. Follow the care plan and local documentation requirements.',
      },
    ],
  },
  {
    id: 'wound',
    title: 'Wound Dressing',
    category: 'Patient Care',
    description:
      'Build confidence with wound assessment and aseptic technique.',
    situation:
      'You are preparing to change a prescribed dressing for a conscious adult patient with a postoperative incision.',
    patient: {
      name: 'Maria Santos',
      age: '56 years old',
      diagnosis: 'Postoperative incision',
      status: 'Conscious and stable',
      detail: 'Care: Prescribed dressing change',
    },
    questions: [
      {
        prompt:
          'Before starting the prescribed dressing change, what should you do?',
        choices: [
          'Remove the dressing immediately.',
          'Check the order and care plan, gather supplies, and perform hand hygiene.',
          'Apply an unprescribed antiseptic.',
        ],
        correct: 1,
        explanation:
          'Review the prescribed wound-care plan, prepare the correct supplies, and perform hand hygiene before patient contact. Do not substitute unprescribed products.',
      },
      {
        prompt: 'How should you prepare the patient?',
        choices: [
          'Confirm approved identifiers, explain the procedure, and address comfort and consent.',
          'Begin without explanation to save time.',
          'Ask a visitor to identify the patient by bed number.',
        ],
        correct: 0,
        explanation:
          'Confirm the patient using approved identifiers, explain what will happen, maintain privacy, and address consent and comfort according to policy.',
      },
      {
        prompt: 'What best protects a prepared aseptic field?',
        choices: [
          'Touch all supplies with bare hands.',
          'Place used dressings beside sterile equipment.',
          'Protect key parts and key sites from contamination and follow the prescribed aseptic technique.',
        ],
        correct: 2,
        explanation:
          'Protect key parts and sites from contamination throughout the procedure. Use the aseptic technique specified by the wound-care plan and local policy.',
      },
      {
        prompt:
          'After removing the old dressing using the prescribed technique, what should you assess?',
        choices: [
          'Only whether the new dressing fits.',
          'The wound, surrounding skin, drainage, pain, and signs of infection.',
          'The patient’s preferred dressing color.',
        ],
        correct: 1,
        explanation:
          'Assess and document the wound and surrounding skin, drainage, pain, and any concerning changes. Escalate findings such as spreading redness, unexpected drainage, or systemic symptoms.',
      },
      {
        prompt:
          'The patient reports severe new pain during the procedure. What should you do?',
        choices: [
          'Pause, assess, and escalate or address pain according to the care plan.',
          'Tell the patient all pain is normal.',
          'Continue quickly without assessment.',
        ],
        correct: 0,
        explanation:
          'Pause to assess unexpected severe pain. Follow the care plan and escalation process, and obtain clinical review when indicated before continuing.',
      },
      {
        prompt: 'What completes the dressing-change workflow?',
        choices: [
          'Leave used materials on the bedside table.',
          'Skip documentation if the wound looks unchanged.',
          'Dispose of waste correctly, perform hand hygiene, and document care and findings.',
        ],
        correct: 2,
        explanation:
          'Dispose of waste safely, remove protective equipment as appropriate, perform hand hygiene, and document the wound assessment, treatment, patient tolerance, and any escalation.',
      },
    ],
  },
  {
    id: 'vitals',
    title: 'Vital Signs Assessment',
    category: 'Assessment',
    description:
      'Practice accurate measurements and recognize when to escalate.',
    situation:
      'You are assigned to obtain routine vital signs for a conscious adult patient on a medical ward.',
    patient: {
      name: 'Luis Reyes',
      age: '63 years old',
      diagnosis: 'Observation after dizziness',
      status: 'Conscious and resting',
      detail: 'Care: Routine vital signs',
    },
    questions: [
      {
        prompt: 'What should happen before taking the measurements?',
        choices: [
          'Copy the previous values.',
          'Perform hand hygiene, confirm identity, and explain the assessment.',
          'Measure blood pressure over a thick sleeve.',
        ],
        correct: 1,
        explanation:
          'Perform hand hygiene, identify the patient with approved identifiers, and explain the assessment. Check the required measurements and use appropriate equipment.',
      },
      {
        prompt: 'What should guide your blood-pressure cuff selection?',
        choices: [
          'The patient’s arm circumference and the manufacturer’s sizing guidance.',
          'Use the smallest cuff available.',
          'Use one cuff size for every adult.',
        ],
        correct: 0,
        explanation:
          'Use a cuff appropriate to the patient’s arm circumference and the manufacturer’s instructions. Incorrect sizing can produce misleading results.',
      },
      {
        prompt:
          'How should the arm be positioned for a routine seated blood-pressure reading?',
        choices: [
          'Held unsupported above the head.',
          'Hanging down while the patient talks.',
          'Supported at heart level, with the patient appropriately rested.',
        ],
        correct: 2,
        explanation:
          'Use a supported arm at heart level and the recommended resting position. Avoid talking during measurement and follow the device instructions and local protocol.',
      },
      {
        prompt:
          'A reading is unexpected, but the patient appears stable. What should you do?',
        choices: [
          'Delete the reading without telling anyone.',
          'Assess the patient, check technique and equipment, and repeat or escalate according to policy.',
          'Record a normal value instead.',
        ],
        correct: 1,
        explanation:
          'Assess the patient and check for measurement or equipment problems. Repeat when appropriate and escalate concerning findings according to policy. Never invent or alter values.',
      },
      {
        prompt:
          'The patient develops chest pain and shortness of breath. What is your priority?',
        choices: [
          'Assess immediately and activate the appropriate urgent response.',
          'Finish recording all routine measurements first.',
          'Wait until the next scheduled observation.',
        ],
        correct: 0,
        explanation:
          'New chest pain and breathing difficulty require immediate assessment and escalation. Follow the local urgent or emergency response protocol.',
      },
      {
        prompt: 'How should you document and communicate the results?',
        choices: [
          'Record only measurements that are normal.',
          'Rely on memory until the end of the shift.',
          'Record actual values, relevant circumstances, and actions; communicate concerning findings promptly.',
        ],
        correct: 2,
        explanation:
          'Document actual observations promptly, including relevant context and any actions taken. Communicate abnormal or concerning findings using the local escalation process.',
      },
    ],
  },
];

export const resourceItems = [
  {
    title: 'Hand hygiene essentials',
    category: 'Infection prevention',
    description:
      'Review the moments for hand hygiene and why gloves are not a substitute.',
    url: 'https://www.cdc.gov/clean-hands/hcp/clinical-safety/index.html',
  },
  {
    title: 'Patient identification',
    category: 'Patient safety',
    description:
      'Explore WHO resources on patient safety and safer systems of care.',
    url: 'https://www.who.int/health-topics/patient-safety',
  },
  {
    title: 'Blood pressure measurement',
    category: 'Assessment',
    description:
      'Read practical guidance on measuring blood pressure accurately.',
    url: 'https://www.heart.org/en/health-topics/high-blood-pressure/monitoring-your-blood-pressure-at-home',
  },
];

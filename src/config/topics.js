// High-yield topics per subject for MBBS
const TOPICS_BY_SUBJECT = {
  Anatomy: [
    { id: 'ana-1', title: 'Brachial Plexus', yield: 'high' },
    { id: 'ana-2', title: 'Femoral Triangle', yield: 'high' },
    { id: 'ana-3', title: 'Cranial Nerves', yield: 'high' },
    { id: 'ana-4', title: 'Thoracic Duct', yield: 'medium' },
    { id: 'ana-5', title: 'Portal Circulation', yield: 'high' },
    { id: 'ana-6', title: 'Circle of Willis', yield: 'high' },
    { id: 'ana-7', title: 'Inguinal Canal', yield: 'high' },
    { id: 'ana-8', title: 'Axilla', yield: 'medium' },
    { id: 'ana-9', title: 'Cubital Fossa', yield: 'medium' },
    { id: 'ana-10', title: 'Cavernous Sinus', yield: 'high' },
  ],
  Physiology: [
    { id: 'phy-1', title: 'Cardiac Cycle', yield: 'high' },
    { id: 'phy-2', title: 'Resting Membrane Potential', yield: 'high' },
    { id: 'phy-3', title: 'Haemoglobin & Oxygen Dissociation Curve', yield: 'high' },
    { id: 'phy-4', title: 'Renal Regulation of BP', yield: 'high' },
    { id: 'phy-5', title: 'Neuromuscular Junction', yield: 'high' },
    { id: 'phy-6', title: 'GFR & its Regulation', yield: 'medium' },
    { id: 'phy-7', title: 'ECG', yield: 'high' },
    { id: 'phy-8', title: 'Lung Volumes & Capacities', yield: 'high' },
    { id: 'phy-9', title: 'CSF', yield: 'medium' },
    { id: 'phy-10', title: 'Thyroid Hormone Regulation', yield: 'medium' },
  ],
  Biochemistry: [
    { id: 'bio-1', title: 'Glycolysis', yield: 'high' },
    { id: 'bio-2', title: 'TCA Cycle', yield: 'high' },
    { id: 'bio-3', title: 'Enzyme Kinetics', yield: 'high' },
    { id: 'bio-4', title: 'Fatty Acid Oxidation', yield: 'medium' },
    { id: 'bio-5', title: 'Urea Cycle', yield: 'high' },
    { id: 'bio-6', title: 'DNA Replication & Repair', yield: 'high' },
    { id: 'bio-7', title: 'Protein Synthesis', yield: 'medium' },
    { id: 'bio-8', title: 'Haemoglobin Disorders', yield: 'high' },
    { id: 'bio-9', title: 'Vitamins & Cofactors', yield: 'high' },
    { id: 'bio-10', title: 'Cholesterol Metabolism', yield: 'medium' },
  ],
  Pathology: [
    { id: 'pat-1', title: 'Cell Injury & Death', yield: 'high' },
    { id: 'pat-2', title: 'Inflammation', yield: 'high' },
    { id: 'pat-3', title: 'Neoplasia', yield: 'high' },
    { id: 'pat-4', title: 'Haemodynamic Disorders', yield: 'high' },
    { id: 'pat-5', title: 'Wound Healing', yield: 'medium' },
    { id: 'pat-6', title: 'Amyloidosis', yield: 'medium' },
    { id: 'pat-7', title: 'Anaemia Classification', yield: 'high' },
    { id: 'pat-8', title: 'Hypersensitivity Reactions', yield: 'high' },
    { id: 'pat-9', title: 'Autoimmune Diseases', yield: 'medium' },
    { id: 'pat-10', title: 'Infectious Granulomas (TB)', yield: 'high' },
  ],
  Pharmacology: [
    { id: 'phr-1', title: 'Pharmacokinetics', yield: 'high' },
    { id: 'phr-2', title: 'Autonomic Drugs', yield: 'high' },
    { id: 'phr-3', title: 'Antibiotics Classification', yield: 'high' },
    { id: 'phr-4', title: 'Antihypertensives', yield: 'high' },
    { id: 'phr-5', title: 'NSAIDs & Analgesics', yield: 'high' },
    { id: 'phr-6', title: 'Antidiabetics', yield: 'medium' },
    { id: 'phr-7', title: 'Antiepileptics', yield: 'medium' },
    { id: 'phr-8', title: 'Antitubercular Drugs', yield: 'high' },
    { id: 'phr-9', title: 'Drug Interactions', yield: 'medium' },
    { id: 'phr-10', title: 'Opioids & ADRs', yield: 'high' },
  ],
  Microbiology: [
    { id: 'mic-1', title: 'Gram Staining', yield: 'high' },
    { id: 'mic-2', title: 'Bacterial Virulence Factors', yield: 'high' },
    { id: 'mic-3', title: 'Sterilization & Disinfection', yield: 'high' },
    { id: 'mic-4', title: 'Hepatitis Viruses', yield: 'high' },
    { id: 'mic-5', title: 'HIV & AIDS', yield: 'high' },
    { id: 'mic-6', title: 'Antimicrobial Resistance', yield: 'medium' },
    { id: 'mic-7', title: 'Mycobacterium tuberculosis', yield: 'high' },
    { id: 'mic-8', title: 'Fungal Infections', yield: 'medium' },
    { id: 'mic-9', title: 'Complement System', yield: 'medium' },
    { id: 'mic-10', title: 'Vaccine Types & Immunisation', yield: 'high' },
  ],
};

// Default fallback for subjects not in the hardcoded list
const DEFAULT_TOPICS = [
  { id: 'gen-1', title: 'Basic Concepts', yield: 'high' },
  { id: 'gen-2', title: 'Clinical Significance', yield: 'high' },
  { id: 'gen-3', title: 'Recent Advances', yield: 'medium' },
  { id: 'gen-4', title: 'Common Exam PYQs', yield: 'high' },
  { id: 'gen-5', title: 'Key Mnemonics', yield: 'medium' },
];

const getTopicsForSubject = (subject) => TOPICS_BY_SUBJECT[subject] || DEFAULT_TOPICS;

module.exports = { getTopicsForSubject };

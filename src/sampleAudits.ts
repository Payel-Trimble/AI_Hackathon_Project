import type { AuditRow } from './audit';

const NOTE =
  'For technical support, licensing, or implementation inquiries regarding this integration, please contact the developer directly.';

export const SAMPLE_SOURCE = 'Sample audit batch · 1 Oct 2026 and 7 Oct 2026';

export const sampleAudits: AuditRow[] = [
  {
    productName: 'Field Measure Sync',
    optimizedTitle: 'Field Measure Sync',
    briefOverview: 'The listing does not describe the product.',
    splashDescription:
      'The marketplace listing does not state what Field Measure Sync does or who it is for. Publish only after the partner supplies a description.',
    keyBenefits: '- No capabilities are stated in the source listing',
    mandatoryNote: NOTE,
    asoKeywords: 'field measure',
    rubricScore: 1,
    nonComplianceFlags: '- Empty description',
    batchRunDate: '2026-10-01',
  },
  {
    productName: 'Concrete Volume Estimator',
    optimizedTitle: 'Concrete Volume Estimator',
    briefOverview: 'Concrete Volume Estimator is listed without a stated buyer outcome.',
    splashDescription:
      'The listing names the product and little else. It does not say who estimates concrete volume, or which workflow the tool supports.',
    keyBenefits: '- Names concrete volume estimating',
    mandatoryNote: NOTE,
    asoKeywords: 'concrete volume, estimating',
    rubricScore: 3,
    nonComplianceFlags:
      '- Missing audience\n- Missing problem\n- Missing concrete capabilities',
    batchRunDate: '2026-10-01',
  },
  {
    productName: 'Rebar Schedule Link',
    optimizedTitle: 'Rebar Schedule Link',
    briefOverview: 'Rebar Schedule Link moves schedule data between detailing and the field.',
    splashDescription:
      'Detailers rebuild rebar schedules outside the model. Rebar Schedule Link passes the schedule to the field team so the placed steel matches the detail set. The listing does not say which roles use it.',
    keyBenefits:
      '- Passes the rebar schedule to the field\n- Keeps placed steel aligned with the detail set',
    mandatoryNote: NOTE,
    asoKeywords: 'rebar schedule, detailing, field steel',
    rubricScore: 4,
    nonComplianceFlags: '- Missing audience\n- Missing workflow',
    batchRunDate: '2026-10-01',
  },
  {
    productName: 'Haul Route Planner',
    optimizedTitle: 'Haul Route Planner',
    briefOverview: 'Haul Route Planner is a route tool for site logistics.',
    splashDescription:
      'The listing says the product plans haul routes for site logistics. It does not describe the planning problem or the specific route outputs a buyer would use.',
    keyBenefits: '- Plans haul routes',
    mandatoryNote: NOTE,
    asoKeywords: 'haul route, site logistics',
    rubricScore: 4,
    nonComplianceFlags: '- Missing problem\n- Missing concrete capabilities',
    batchRunDate: '2026-10-01',
  },
  {
    productName: 'As-Built Photo Log',
    optimizedTitle: 'As-Built Photo Log',
    briefOverview: 'As-Built Photo Log stores site photos against the locations they document.',
    splashDescription:
      'Superintendents collect as-built photos that are hard to find later. As-Built Photo Log stores each photo with the location it documents, so closeout packages keep the visual record with the work.',
    keyBenefits:
      '- Stores site photos with a location\n- Keeps closeout photos with the work they document',
    mandatoryNote: NOTE,
    asoKeywords: 'as-built photos, closeout, site documentation, superintendent',
    rubricScore: 5,
    nonComplianceFlags: '- Missing workflow',
    batchRunDate: '2026-10-01',
  },
  {
    productName: 'Crew Time Bridge',
    optimizedTitle: 'Crew Time Bridge',
    briefOverview: 'Crew Time Bridge sends crew hours from the field into payroll.',
    splashDescription:
      'Payroll teams re-key crew hours after the shift. Crew Time Bridge sends those hours into payroll. The listing does not name the field role that enters time.',
    keyBenefits: '- Sends crew hours to payroll\n- Removes re-keying after the shift',
    mandatoryNote: NOTE,
    asoKeywords: 'crew time, payroll, field hours',
    rubricScore: 5,
    nonComplianceFlags: '- Missing audience',
    batchRunDate: '2026-10-01',
  },
  {
    productName: 'Inspection Punch Connector',
    optimizedTitle: 'Inspection Punch Connector for punch closure',
    briefOverview: 'Inspection Punch Connector gives inspectors one list of open punch items.',
    splashDescription:
      'Inspectors close punch from inboxes and spreadsheets. Inspection Punch Connector collects open punch items into one list so the inspection can close against the remaining work. The listing names the list, not the actions on an item.',
    keyBenefits: '- Collects open punch items\n- Supports inspection closeout',
    mandatoryNote: NOTE,
    asoKeywords: 'punch list, inspection, closeout, punch items',
    rubricScore: 6,
    nonComplianceFlags: '- Missing concrete capabilities',
    batchRunDate: '2026-10-01',
  },
  {
    productName: 'Earthwork Quantity Link',
    optimizedTitle: 'Earthwork Quantity Link',
    briefOverview:
      'Earthwork Quantity Link gives estimators model quantities they can trace back to the surface.',
    splashDescription:
      'Estimators lose the link between a quantity and the surface it came from. Earthwork Quantity Link reads the surface and produces quantities the estimator can trace to that surface, so the takeoff stays with the design used for the bid.',
    keyBenefits:
      '- Reads quantities from the surface\n- Traces each quantity to the source surface\n- Keeps the takeoff with the bid design',
    mandatoryNote: NOTE,
    asoKeywords: 'earthwork quantities, surface takeoff, estimating, bid quantities',
    rubricScore: 8,
    nonComplianceFlags: 'None',
    batchRunDate: '2026-10-01',
  },
  {
    productName: 'Daily Report Connector',
    optimizedTitle: 'Daily Report Connector',
    briefOverview: 'Daily Report Connector is listed without a stated buyer outcome.',
    splashDescription:
      'The listing names daily reports and does not say who files them, what is late or missing, or what the connector changes in that workflow.',
    keyBenefits: '- Mentions daily reports',
    mandatoryNote: NOTE,
    asoKeywords: 'daily report',
    rubricScore: 3,
    nonComplianceFlags: '- Missing audience\n- Missing problem',
    batchRunDate: '2026-10-07',
  },
  {
    productName: 'Utility Clash Export',
    optimizedTitle: 'Utility Clash Export',
    briefOverview: 'Utility Clash Export sends utility clashes to the coordination team.',
    splashDescription:
      'Coordination meetings stall when utility clashes stay in the model. Utility Clash Export sends those clashes to the coordination team. The listing does not describe how a clash is reviewed or closed.',
    keyBenefits: '- Exports utility clashes\n- Sends clashes to the coordination team',
    mandatoryNote: NOTE,
    asoKeywords: 'utility clash, coordination, clash export',
    rubricScore: 6,
    nonComplianceFlags: '- Missing workflow',
    batchRunDate: '2026-10-07',
  },
  {
    productName: 'Grade Check Mobile',
    optimizedTitle: 'Grade Check Mobile',
    briefOverview: 'Grade Check Mobile shows field crews whether a surface is on grade.',
    splashDescription:
      'Checking grade from the model delays the crew. Grade Check Mobile shows whether a surface is on grade. The listing does not say which field role uses the check.',
    keyBenefits: '- Shows whether a surface is on grade\n- Supports a field grade check',
    mandatoryNote: NOTE,
    asoKeywords: 'grade check, field crew, surface grade',
    rubricScore: 6,
    nonComplianceFlags: '- Missing audience',
    batchRunDate: '2026-10-07',
  },
  {
    productName: 'Material Ticket Intake',
    optimizedTitle: 'Material Ticket Intake',
    briefOverview: 'Material Ticket Intake records delivery tickets against the materials log.',
    splashDescription:
      'Delivery tickets are easy to lose before they reach the materials log. Material Ticket Intake records each ticket against that log. The listing does not say which problem this removes or how the ticket moves through the workflow.',
    keyBenefits: '- Records delivery tickets\n- Files tickets on the materials log',
    mandatoryNote: NOTE,
    asoKeywords: 'material tickets, delivery tickets, materials log',
    rubricScore: 5,
    nonComplianceFlags: '- Missing problem\n- Missing workflow',
    batchRunDate: '2026-10-07',
  },
  {
    productName: 'Pile Log Importer',
    optimizedTitle: 'Pile Log Importer',
    briefOverview: 'Pile Log Importer brings pile installation logs into the project record.',
    splashDescription:
      'Pile logs stay with the installation crew and miss the project record. Pile Log Importer brings those logs into the project record so the installed pile can be reviewed later. The listing does not describe the review steps.',
    keyBenefits:
      '- Imports pile installation logs\n- Adds the installed pile to the project record\n- Supports later review of the pile',
    mandatoryNote: NOTE,
    asoKeywords: 'pile log, pile installation, project record',
    rubricScore: 7,
    nonComplianceFlags: '- Missing workflow',
    batchRunDate: '2026-10-07',
  },
  {
    productName: 'Survey Control Publisher',
    optimizedTitle: 'Survey Control Publisher',
    briefOverview:
      'Survey Control Publisher gives field crews the control points used for that day’s layout.',
    splashDescription:
      'Field crews stake from control files that are out of date by the time they reach the site. Survey Control Publisher sends the current control points to the crew doing that day’s layout, so the stakeout uses the control set the office released.',
    keyBenefits:
      '- Publishes the current control points\n- Sends control to the layout crew\n- Keeps stakeout on the released control set',
    mandatoryNote: NOTE,
    asoKeywords: 'survey control, stakeout, control points, field layout',
    rubricScore: 8,
    nonComplianceFlags: 'None',
    batchRunDate: '2026-10-07',
  },
  {
    productName: 'Model Quantity Takeoff',
    optimizedTitle: 'Model Quantity Takeoff',
    briefOverview:
      'Model Quantity Takeoff gives estimators quantities they can trace from the model into the bid.',
    splashDescription:
      'Estimators rebuild quantities outside the model and lose the path back to the objects they priced. Model Quantity Takeoff reads the model, groups quantities by the estimator’s work breakdown, and keeps each quantity tied to the model objects in the bid.',
    keyBenefits:
      '- Reads quantities from the model\n- Groups quantities by work breakdown\n- Ties each bid quantity to model objects\n- Keeps the takeoff with the priced design',
    mandatoryNote: NOTE,
    asoKeywords:
      'model quantity takeoff, estimating, work breakdown, bid quantities, model objects',
    rubricScore: 9,
    nonComplianceFlags: 'None',
    batchRunDate: '2026-10-07',
  },
];

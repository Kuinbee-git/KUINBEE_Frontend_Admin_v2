// Synthetic capture details using the v5 field names returned by discovery.
export const metadataSchema = { enforced: true, fields: [
  ...['capture_country', 'capture_city'].map((name) => ({ name, type: 'string', required: true })),
  { name: 'capture_date', type: 'date', required: true },
  ...['collection_start_time', 'collection_end_time'].map((name) => ({ name, type: 'timestamp', required: true })),
  ...['contributor_id', 'task_environment', 'task_subenvironment', 'hardware_information', 'software_information'].map((name) => ({ name, type: 'string', required: true })),
  { name: 'camera_intrinsics', type: 'object', required: true, fields: [] },
] };
export const customMetadata = {
  capture_country: 'India', capture_city: 'Pune', capture_date: '2026-11-04',
  collection_start_time: '2026-11-04T09:12:00+05:30', collection_end_time: '2026-11-04T09:22:00+05:30',
  contributor_id: 'TEST-COL-001', task_environment: 'Kitchen', task_subenvironment: 'Preparing vegetables',
  hardware_information: 'GoPro HERO12 Black', software_information: 'Firmware 2.0',
  camera_intrinsics: { K: [[1200, 0, 960], [0, 1200, 720], [0, 0, 1]], width: 1920, height: 1440 },
};
export async function fillMetadata(page, prefix, custom = customMetadata) {
  for (const [name, value] of Object.entries(custom)) {
    await page.locator(`#${prefix}-${name}`).fill(typeof value === 'string' ? value : JSON.stringify(value));
  }
}

export const uploadReceipt = async (file: File, applicationId: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large');
  }

  // Generate secure filename: timestamp_appId_sanitizedName
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
  const fileName = `${timestamp}_${applicationId}_${sanitizedName}`;
  
  // Return the simulated path
  // In production, this would be the URL returned by the server
  return `/uploads/receipts/${fileName}`;
};

export const generatePreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

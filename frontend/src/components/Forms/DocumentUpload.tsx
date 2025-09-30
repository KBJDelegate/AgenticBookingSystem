import React, { useCallback } from 'react';
import { Box, Button, Typography, Paper, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

interface Props {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const DocumentUpload: React.FC<Props> = ({ formData, updateFormData, onNext, onBack }) => {
  const [files, setFiles] = React.useState<File[]>(formData.documents || []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles];
    setFiles(newFiles);
    updateFormData({ documents: newFiles });
  }, [files]);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    updateFormData({ documents: newFiles });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc', '.docx']
    }
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Upload Documents (Optional)
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Upload any relevant insurance documents, IDs, or other files
      </Typography>

      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          mt: 3,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: 'divider'
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        {isDragActive ? (
          <Typography>Drop the files here...</Typography>
        ) : (
          <Typography>Drag & drop files here, or click to select files</Typography>
        )}
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Supported: PDF, Images, Word documents
        </Typography>
      </Paper>

      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Uploaded Files:</Typography>
          <List>
            {files.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton edge="end" onClick={() => removeFile(index)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024).toFixed(2)} KB`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} variant="outlined">
          Back
        </Button>
        <Button onClick={onNext} variant="contained">
          Continue
        </Button>
      </Box>
    </Box>
  );
};

export default DocumentUpload;
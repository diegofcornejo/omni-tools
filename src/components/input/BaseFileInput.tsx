import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import InputHeader from '../InputHeader';
import InputFooter from './InputFooter';
import {
  BaseFileInputProps,
  createObjectURL,
  revokeObjectURL
} from './file-input-utils';
import { globalInputHeight } from '../../config/uiConfig';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';
import greyPattern from '@assets/grey-pattern.png';
import { isArray } from 'lodash';
import { useTranslation } from 'react-i18next';

interface BaseFileInputComponentProps extends BaseFileInputProps {
  children: (props: { preview: string | undefined }) => ReactNode;
  type: 'image' | 'video' | 'audio' | 'pdf';
}

export default function BaseFileInput({
  value,
  onChange,
  accept,
  title,
  children,
  type
}: BaseFileInputComponentProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const theme = useTheme();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { showSnackBar } = useContext(CustomSnackBarContext);

  useEffect(() => {
    if (value) {
      try {
        const objectUrl = createObjectURL(value);
        setPreview(objectUrl);
        return () => revokeObjectURL(objectUrl);
      } catch (error) {
        console.error('Error previewing file:', error);
      }
    } else setPreview(null);
  }, [value]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onChange(file);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCopy = () => {
    if (isArray(value)) {
      const blob = new Blob([value[0]], { type: value[0].type });
      const clipboardItem = new ClipboardItem({ [value[0].type]: blob });

      navigator.clipboard
        .write([clipboardItem])
        .then(() => showSnackBar(t('baseFileInput.fileCopied'), 'success'))
        .catch((err) => {
          showSnackBar(t('baseFileInput.copyFailed', { error: err }), 'error');
        });
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];

      // Check if file type is acceptable
      const isAcceptable = accept.some((acceptType) => {
        // Handle wildcards like "image/*"
        if (acceptType.endsWith('/*')) {
          const category = acceptType.split('/')[0];
          return file.type.startsWith(category);
        }
        return acceptType === file.type;
      });

      if (isAcceptable) {
        onChange(file);
      } else {
        showSnackBar(
          `Invalid file type. Please use ${accept.join(', ')}`,
          'error'
        );
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const clipboardItems = event.clipboardData?.items ?? [];
      const item = clipboardItems[0];
      if (
        item &&
        (item.type.includes('image') || item.type.includes('video'))
      ) {
        const file = item.getAsFile();
        if (file) onChange(file);
      }
    };
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onChange]);

  return (
    <Box>
      <InputHeader
        title={title || 'Input ' + type.charAt(0).toUpperCase() + type.slice(1)}
      />
      <Box
        sx={{
          width: '100%',
          height: globalInputHeight,
          border: preview ? 0 : 1,
          borderRadius: 2,
          boxShadow: '5',
          bgcolor: 'background.paper',
          position: 'relative',
          borderColor: isDragging ? theme.palette.primary.main : undefined,
          borderWidth: isDragging ? 2 : 1,
          borderStyle: isDragging ? 'dashed' : 'solid'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <Box
            width="100%"
            height="100%"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage:
                theme.palette.mode === 'dark' ? null : `url(${greyPattern})`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {children({ preview })}
          </Box>
        ) : (
          <Box
            onClick={handleImportClick}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 5,
              height: '100%',
              cursor: 'pointer'
            }}
          >
            {isDragging ? (
              <Typography
                color={theme.palette.primary.main}
                variant="h6"
                align="center"
              >
                {t('baseFileInput.dropFileHere', { type })}
              </Typography>
            ) : (
              <Typography
                color={
                  theme.palette.mode === 'dark'
                    ? theme.palette.grey['300']
                    : theme.palette.grey['600']
                }
              >
                {t('baseFileInput.selectFileDescription', { type })}
              </Typography>
            )}
          </Box>
        )}
      </Box>
      <InputFooter handleCopy={handleCopy} handleImport={handleImportClick} />
      <input
        ref={fileInputRef}
        style={{ display: 'none' }}
        type="file"
        accept={accept.join(',')}
        onChange={handleFileChange}
        multiple={false}
      />
    </Box>
  );
}

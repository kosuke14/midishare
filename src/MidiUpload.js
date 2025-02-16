import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Typography,
    CircularProgress,
    Container,
    Select,
    MenuItem,
    Link,
    Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Midi } from '@tonejs/midi';

const translations = require("./translations.json");

const MidiUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);
    const [language, setLanguage] = useState(() => {
        const savedLang = localStorage.getItem('appLanguage');
        return savedLang || (window.navigator.language === 'ja' ? 'ja' : 'en');
    });
    useEffect(() => {
        localStorage.setItem('appLanguage', language);
    }, [language]);

    const t = translations[language];

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        event.target.files = null;
        if (!file) return;

        setError(null);

        if (file.type !== 'audio/mid' && file.type !== 'audio/midi' && file.type !== 'audio/x-midi') {
            setError(t.fileTypeError);
            return;
        }

        try {
            const fileData = await readFileContent(file);
            setSelectedFile({ file, data: fileData });
            setError(null);
        } catch (err) {
            setError(t.error + err.message);
        }
    };

    const readFileContent = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const midi = new Midi(e.target.result);
                    resolve(midi);
                } catch (err) {
                    reject(new Error('Invalid MIDI format'));
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        });
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setError(null);
        setUploadResult(null);

        try {
            const response = await axios.post('https://jsonblob.com/api/jsonBlob', selectedFile.data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const locationUrl = response.headers.location;
            setUploadResult(locationUrl);
            setSelectedFile(null);
        } catch (err) {
            setError(t.error + (err.response?.data?.message || err.message));
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3
                }}
            >
                <Box sx={{ alignSelf: 'flex-end' }}>
                    <Select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        size="small"
                    >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="ja">日本語</MenuItem>
                    </Select>
                </Box>

                <Typography variant="h4" component="h1">
                    {t.title}
                </Typography>

                <input
                    accept="audio/midi"
                    style={{ display: 'none' }}
                    id="contained-button-file"
                    type="file"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
                <label htmlFor="contained-button-file">
                    <Button
                        variant="contained"
                        component="span"
                        disabled={isUploading}
                    >
                        {t.selectFile}
                    </Button>
                </label>

                {selectedFile && (
                    <Typography variant="body1">
                        {t.selectedFile} {selectedFile.file.name}
                    </Typography>
                )}

                {error && (
                    <Alert severity="error" sx={{ width: '100%' }}>
                        {error}
                        <Button onClick={() => setError(null)} sx={{ ml: 2 }}>
                            {t.retry}
                        </Button>
                    </Alert>
                )}

                <Typography>
                    {t.privacy}
                </Typography>

                <Button
                    variant="contained"
                    color="success"
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    startIcon={
                        isUploading && <CircularProgress size={20} color="inherit" />
                    }
                >
                    {isUploading ? t.uploading : t.upload}
                </Button>

                {uploadResult && (
                    <Alert severity="success" sx={{ width: '100%' }}>
                        {t.success}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Link href={uploadResult} target="_blank" rel="noopener">
                                {uploadResult}
                            </Link>
                            <Button
                                size="small"
                                onClick={() => {
                                    navigator.clipboard.writeText(uploadResult);
                                    setTimeout(() => alert(t.copied), 300);
                                }}
                                startIcon={<ContentCopyIcon fontSize="small" />}
                            >
                                {t.copy}
                            </Button>
                        </Box>
                    </Alert>
                )}

                <Typography>
                    {t.deletion}
                </Typography>
            </Box>
        </Container>
    );
};

export default MidiUpload;
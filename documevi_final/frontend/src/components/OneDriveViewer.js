import React, { useState, useEffect } from 'react';
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { Client } from '@microsoft/microsoft-graph-client';

const OneDriveViewer = () => {
  const { instance, accounts } = useMsal();
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (accounts.length > 0) {
      const getFiles = async () => {
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            account: accounts[0],
            scopes: ["Files.Read.All"]
          });

          const graphClient = Client.init({
            authProvider: (done) => {
              done(null, tokenResponse.accessToken);
            }
          });

          const response = await graphClient.api("/me/drive/root/children").get();
          setFiles(response.value);
        } catch (error) {
          console.error(error);
        }
      };
      getFiles();
    }
  }, [accounts, instance]);

  const handleLogin = () => {
    instance.loginPopup({
      scopes: ["Files.Read.All"]
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Visor de OneDrive</h1>
      
      <UnauthenticatedTemplate>
        <p>Por favor, inicia sesión con tu cuenta de Microsoft para ver los archivos.</p>
        <button onClick={handleLogin}>Iniciar Sesión con Microsoft</button>
      </UnauthenticatedTemplate>
      
      <AuthenticatedTemplate>
        <p>Archivos en la raíz de tu OneDrive:</p>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {files.map(file => (
            <li key={file.id} style={{ margin: '5px 0' }}>
              <a href={file.webUrl} target="_blank" rel="noopener noreferrer">
                {file.folder ? '📁' : '📄'} {file.name}
              </a>
            </li>
          ))}
        </ul>
      </AuthenticatedTemplate>
    </div>
  );
};

export default OneDriveViewer;
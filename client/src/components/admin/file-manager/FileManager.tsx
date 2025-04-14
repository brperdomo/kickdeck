import React, { useState } from 'react';
import { FileManagerProvider } from './FileManagerContext';
import Breadcrumbs from './Breadcrumbs';
import Toolbar from './Toolbar';
import FileManagerContent from './FileManagerContent';
import FileUploader from './FileUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FileManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('browse');
  
  return (
    <FileManagerProvider>
      <Card className="shadow-sm w-full">
        <CardHeader className="pb-2">
          <CardTitle>File Manager</CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="browse">Browse Files</TabsTrigger>
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="browse" className="space-y-4">
              <Breadcrumbs />
              <Separator />
              <Toolbar />
              <FileManagerContent />
            </TabsContent>
            
            <TabsContent value="upload">
              <div className="space-y-4">
                <Breadcrumbs />
                <Separator />
                <FileUploader />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </FileManagerProvider>
  );
};

export default FileManager;
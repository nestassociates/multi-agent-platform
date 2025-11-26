'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function FeesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState('');
  const [editorContent, setEditorContent] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await fetch('/api/agent/fees');
      const data = await response.json();

      if (data.fees?.content_body) {
        setContent(data.fees.content_body);
        setEditorContent(data.fees.content_body);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/agent/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_body: editorContent }),
      });

      if (response.ok) {
        setContent(editorContent);
        alert('Fee structure saved successfully');
        router.refresh();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }
    } catch (error: any) {
      console.error('Error saving fee structure:', error);
      alert(error.message || 'Failed to save fee structure');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Fee Structure</h1>
        <p className="text-gray-600">
          Create and manage your fee structure using the rich text editor
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Structure Editor</CardTitle>
          <CardDescription>
            Use the editor below to describe your fees however you like - tables, bullet points, or formatted text
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px]">
            <SimpleEditor
              initialContent={content}
              onChange={(html) => setEditorContent(html)}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Fee Structure'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

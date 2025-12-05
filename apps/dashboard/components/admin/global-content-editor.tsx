'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { GlobalContentSidebar } from '@/components/admin/global-content-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Save, Upload, AlertTriangle, Plus, Trash2, ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import {
  headerContentSchema,
  footerContentSchema,
  legalContentSchema,
  type HeaderContent,
  type FooterContent,
  type LegalContent,
  type GlobalContentType,
} from '@nest/validation';

interface GlobalContentEditorProps {
  contentType: GlobalContentType;
  initialData?: {
    id?: string;
    content: HeaderContent | FooterContent | LegalContent | null;
    isPublished: boolean;
    publishedAt: string | null;
    updatedAt: string | null;
  };
  activeAgentCount: number;
}

const contentTypeLabels: Record<GlobalContentType, string> = {
  header: 'Header',
  footer: 'Footer',
  privacy_policy: 'Privacy Policy',
  terms_of_service: 'Terms of Service',
  cookie_policy: 'Cookie Policy',
  complaints_procedure: 'Complaints Procedure',
};

export function GlobalContentEditor({
  contentType,
  initialData,
  activeAgentCount,
}: GlobalContentEditorProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLegalPage = ['privacy_policy', 'terms_of_service', 'cookie_policy', 'complaints_procedure'].includes(contentType);

  // State for legal content (HTML editor)
  const [legalHtml, setLegalHtml] = useState<string>(
    isLegalPage && initialData?.content
      ? (initialData.content as LegalContent).html || ''
      : ''
  );

  // Form for header content
  const headerForm = useForm<HeaderContent>({
    resolver: zodResolver(headerContentSchema),
    defaultValues: contentType === 'header' && initialData?.content
      ? (initialData.content as HeaderContent)
      : {
          logo: { url: '', alt: 'Nest Associates' },
          navigation: [],
          cta: null,
        },
  });

  // Form for footer content
  const footerForm = useForm<FooterContent>({
    resolver: zodResolver(footerContentSchema),
    defaultValues: contentType === 'footer' && initialData?.content
      ? (initialData.content as FooterContent)
      : {
          columns: [],
          contact: {},
          social: [],
          copyright: `© ${new Date().getFullYear()} Nest Associates. All rights reserved.`,
        },
  });

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      let content: HeaderContent | FooterContent | LegalContent;

      if (contentType === 'header') {
        const isValid = await headerForm.trigger();
        if (!isValid) {
          setIsSaving(false);
          return;
        }
        content = headerForm.getValues();
      } else if (contentType === 'footer') {
        const isValid = await footerForm.trigger();
        if (!isValid) {
          setIsSaving(false);
          return;
        }
        content = footerForm.getValues();
      } else {
        // Legal page
        if (!legalHtml.trim()) {
          setError('Content is required');
          setIsSaving(false);
          return;
        }
        content = { html: legalHtml };
      }

      const response = await fetch(`/api/admin/global-content/${contentType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to save content');
      }

      setLastSaved(new Date());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setError(null);
    setIsPublishing(true);

    try {
      // Save first
      await handleSave();

      const response = await fetch(`/api/admin/global-content/${contentType}/publish`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to publish content');
      }

      const result = await response.json();
      setShowPublishDialog(false);
      router.refresh();
      alert(`Content published successfully! ${result.rebuildsQueued} agent sites queued for rebuild.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish content');
    } finally {
      setIsPublishing(false);
    }
  };

  const hasUnpublishedChanges = initialData?.publishedAt
    ? !!(initialData.updatedAt && new Date(initialData.updatedAt) > new Date(initialData.publishedAt))
    : !initialData?.isPublished;

  // For legal pages, use the new two-column layout
  if (isLegalPage) {
    return (
      <>
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2 md:gap-4">
              <Link
                href="/global-content"
                className="flex items-center gap-1 md:gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Global Content</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <span className="text-gray-300 hidden md:inline">|</span>
              <h1 className="text-base md:text-lg font-semibold text-gray-900 hidden md:block">
                Edit {contentTypeLabels[contentType]}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded hidden md:block">
                  {error}
                </div>
              )}
              {isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
            </div>
          </div>

          {/* Error on mobile - separate line */}
          {error && isMobile && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Unpublished changes banner */}
          {hasUnpublishedChanges && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-amber-800">Unpublished Changes: </span>
                  <span className="text-amber-700">This content has changes that have not been published to agent sites.</span>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area - 2 Column Layout on desktop, single column on mobile */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor Column */}
            <LegalPageEditorColumn html={legalHtml} onChange={setLegalHtml} />

            {/* Sidebar Column - hidden on mobile, visible in sheet */}
            {!isMobile && (
              <GlobalContentSidebar
                contentType={contentType}
                onSave={handleSave}
                onPublish={() => setShowPublishDialog(true)}
                isSaving={isSaving}
                isPublishing={isPublishing}
                lastSaved={lastSaved}
                hasUnpublishedChanges={hasUnpublishedChanges ?? false}
                activeAgentCount={activeAgentCount}
                isPublished={initialData?.isPublished ?? false}
                publishedAt={initialData?.publishedAt ?? null}
              />
            )}
          </div>

          {/* Mobile Sidebar Sheet */}
          {isMobile && (
            <GlobalContentSidebar
              contentType={contentType}
              onSave={handleSave}
              onPublish={() => setShowPublishDialog(true)}
              isSaving={isSaving}
              isPublishing={isPublishing}
              lastSaved={lastSaved}
              hasUnpublishedChanges={hasUnpublishedChanges ?? false}
              activeAgentCount={activeAgentCount}
              isPublished={initialData?.isPublished ?? false}
              publishedAt={initialData?.publishedAt ?? null}
              isMobile
              isOpen={sidebarOpen}
              onOpenChange={setSidebarOpen}
            />
          )}
        </div>

        {/* Publish confirmation dialog */}
        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish {contentTypeLabels[contentType]}?</DialogTitle>
              <DialogDescription>
                This will update the {contentTypeLabels[contentType].toLowerCase()} on all agent sites.
                <strong className="block mt-2">
                  {activeAgentCount} active agent sites will be queued for rebuild.
                </strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Publish to All Sites
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // For header and footer, use the original card-based layout
  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit {contentTypeLabels[contentType]}
          </h1>
          <p className="text-muted-foreground">
            Configure the {contentType} settings for all agent sites
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-sm text-muted-foreground">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={handleSave} disabled={isSaving} variant="outline">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button onClick={() => setShowPublishDialog(true)} disabled={isSaving || isPublishing}>
            {isPublishing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Publish
          </Button>
        </div>
      </div>

      {/* Status banner */}
      {hasUnpublishedChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Unpublished Changes</p>
            <p className="text-sm text-amber-700">
              This content has changes that have not been published to agent sites.
            </p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Content editor based on type */}
      {contentType === 'header' ? (
        <HeaderEditor form={headerForm} />
      ) : (
        <FooterEditor form={footerForm} />
      )}

      {/* Publish confirmation dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish {contentTypeLabels[contentType]}?</DialogTitle>
            <DialogDescription>
              This will update the {contentTypeLabels[contentType].toLowerCase()} on all agent sites.
              <strong className="block mt-2">
                {activeAgentCount} active agent sites will be queued for rebuild.
              </strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Publish to All Sites
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Legal page editor column with TipTap - styled like ContentEditor
function LegalPageEditorColumn({
  html,
  onChange,
}: {
  html: string;
  onChange: (html: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Editor Area - Full height with same styling as content-editor */}
      <div className="flex-1 overflow-hidden">
        <style>{`
          .legal-editor-container .simple-editor-wrapper {
            height: 100%;
          }
          .legal-editor-container .simple-editor-content {
            max-width: 100%;
            padding: 0 1rem;
          }
          @media (min-width: 768px) {
            .legal-editor-container .simple-editor-content {
              padding: 0 2rem;
            }
          }
          .legal-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor {
            padding: 1rem 0 30vh;
          }
          @media (min-width: 768px) {
            .legal-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor {
              padding: 1.5rem 0 30vh;
            }
          }
          .legal-editor-container .tiptap ::selection,
          .legal-editor-container .tiptap *::selection {
            background: #3b82f6 !important;
            color: white !important;
          }
          .legal-editor-container .ProseMirror-selectednode {
            outline: 2px solid #3b82f6 !important;
          }
          /* Placeholder styling */
          .legal-editor-container .tiptap p.is-editor-empty:first-child::before {
            color: #9ca3af;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
        `}</style>
        <div className="legal-editor-container h-full">
          <SimpleEditor
            initialContent={html}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
}

// Header editor with structured form
function HeaderEditor({ form }: { form: ReturnType<typeof useForm<HeaderContent>> }) {
  const { register, watch, setValue, formState: { errors } } = form;
  const navigation = watch('navigation') || [];
  const cta = watch('cta');

  const addNavItem = () => {
    setValue('navigation', [...navigation, { label: '', href: '' }]);
  };

  const removeNavItem = (index: number) => {
    setValue('navigation', navigation.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Logo settings */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>Configure the site logo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="logo-url">Logo URL</Label>
            <Input
              id="logo-url"
              {...register('logo.url')}
              placeholder="https://example.com/logo.png"
            />
            {errors.logo?.url && (
              <p className="text-sm text-red-600">{errors.logo.url.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="logo-alt">Alt Text</Label>
            <Input
              id="logo-alt"
              {...register('logo.alt')}
              placeholder="Company logo"
            />
            {errors.logo?.alt && (
              <p className="text-sm text-red-600">{errors.logo.alt.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation items */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation</CardTitle>
          <CardDescription>Add navigation links (max 10)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {navigation.map((_, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1 grid gap-2">
                <Label>Label</Label>
                <Input
                  {...register(`navigation.${index}.label`)}
                  placeholder="About Us"
                />
              </div>
              <div className="flex-1 grid gap-2">
                <Label>URL</Label>
                <Input
                  {...register(`navigation.${index}.href`)}
                  placeholder="/about"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-8"
                onClick={() => removeNavItem(index)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {navigation.length < 10 && (
            <Button type="button" variant="outline" onClick={addNavItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Navigation Item
            </Button>
          )}
        </CardContent>
      </Card>

      {/* CTA Button */}
      <Card>
        <CardHeader>
          <CardTitle>Call to Action Button</CardTitle>
          <CardDescription>Optional CTA button in the header</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="cta-label">Button Label</Label>
            <Input
              id="cta-label"
              {...register('cta.label')}
              placeholder="Contact Us"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cta-href">Button URL</Label>
            <Input
              id="cta-href"
              {...register('cta.href')}
              placeholder="/contact"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Footer editor with structured form
function FooterEditor({ form }: { form: ReturnType<typeof useForm<FooterContent>> }) {
  const { register, watch, setValue, formState: { errors } } = form;
  const columns = watch('columns') || [];
  const social = watch('social') || [];

  const addColumn = () => {
    if (columns.length < 4) {
      setValue('columns', [...columns, { title: '', links: [] }]);
    }
  };

  const removeColumn = (index: number) => {
    setValue('columns', columns.filter((_, i) => i !== index));
  };

  const addLinkToColumn = (columnIndex: number) => {
    const newColumns = [...columns];
    if (newColumns[columnIndex].links.length < 10) {
      newColumns[columnIndex].links.push({ label: '', href: '' });
      setValue('columns', newColumns);
    }
  };

  const removeLinkFromColumn = (columnIndex: number, linkIndex: number) => {
    const newColumns = [...columns];
    newColumns[columnIndex].links = newColumns[columnIndex].links.filter((_, i) => i !== linkIndex);
    setValue('columns', newColumns);
  };

  const addSocialLink = () => {
    if (social.length < 6) {
      setValue('social', [...social, { platform: 'facebook' as const, url: '' }]);
    }
  };

  const removeSocialLink = (index: number) => {
    setValue('social', social.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Footer columns */}
      <Card>
        <CardHeader>
          <CardTitle>Footer Columns</CardTitle>
          <CardDescription>Add up to 4 columns with links</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex-1 grid gap-2">
                  <Label>Column Title</Label>
                  <Input
                    {...register(`columns.${columnIndex}.title`)}
                    placeholder="Company"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeColumn(columnIndex)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Links</Label>
                {column.links.map((_, linkIndex) => (
                  <div key={linkIndex} className="flex gap-2 items-center">
                    <Input
                      {...register(`columns.${columnIndex}.links.${linkIndex}.label`)}
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Input
                      {...register(`columns.${columnIndex}.links.${linkIndex}.href`)}
                      placeholder="URL"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLinkFromColumn(columnIndex, linkIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {column.links.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addLinkToColumn(columnIndex)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                )}
              </div>
            </div>
          ))}
          {columns.length < 4 && (
            <Button type="button" variant="outline" onClick={addColumn}>
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Contact information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Contact details shown in the footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              {...register('contact.email')}
              placeholder="hello@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input
              id="contact-phone"
              {...register('contact.phone')}
              placeholder="+44 123 456 7890"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-address">Address</Label>
            <Input
              id="contact-address"
              {...register('contact.address')}
              placeholder="123 Business Street, London"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>Add up to 6 social media links</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {social.map((_, index) => (
            <div key={index} className="flex gap-4 items-center">
              <div className="w-40">
                <select
                  {...register(`social.${index}.platform`)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div className="flex-1">
                <Input
                  {...register(`social.${index}.url`)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSocialLink(index)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {social.length < 6 && (
            <Button type="button" variant="outline" onClick={addSocialLink}>
              <Plus className="h-4 w-4 mr-2" />
              Add Social Link
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Copyright */}
      <Card>
        <CardHeader>
          <CardTitle>Copyright Text</CardTitle>
          <CardDescription>Copyright notice shown at the bottom of the footer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="copyright">Copyright Text</Label>
            <Input
              id="copyright"
              {...register('copyright')}
              placeholder="© 2024 Company Name. All rights reserved."
            />
            {errors.copyright && (
              <p className="text-sm text-red-600">{errors.copyright.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GlobalContentEditor;

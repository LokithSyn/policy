'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-4 pt-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Organization Name</label>
              <Input placeholder="Your Organization" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <Input type="email" placeholder="admin@example.com" />
            </div>
          </div>
          <Button variant="primary">Save Settings</Button>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>IntelliDoc Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-4 pt-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">API URL</label>
              <Input placeholder="https://intellidoc.example.com/api" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">API Key</label>
              <Input type="password" placeholder="Your API Key" />
            </div>
          </div>
          <div>
            <Button variant="primary">Test Connection</Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage your API keys for IntelliPolicy integrations
          </p>
          <Button variant="primary">Generate New Key</Button>
        </CardContent>
      </Card>
    </div>
  );
}

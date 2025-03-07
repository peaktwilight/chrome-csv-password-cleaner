'use client';

import { useState } from 'react';
import { PasswordEntry, PasswordGroup } from '@/types/password';
import { parseCSV, groupPasswordsByDomain, exportToCSV } from '@/utils/passwordUtils';
import PasswordList from '@/components/PasswordList';
import ExportInstructions from '@/components/ExportInstructions';
import { 
  ArrowUpTrayIcon, 
  ArrowDownTrayIcon, 
  ShieldCheckIcon, 
  GlobeAltIcon, 
  DocumentDuplicateIcon,
  CodeBracketIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const [passwordGroups, setPasswordGroups] = useState<PasswordGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer?.files[0];
    if (!file || !file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    try {
      const data = await parseCSV(file);
      const entries = data.map((item): PasswordEntry => ({
        name: item.name,
        url: item.url,
        username: item.username,
        password: item.password,
        timeCreated: item['date_created'],
        timeLastUsed: item['date_last_used'],
        timePasswordChanged: item['date_password_changed'],
        status: 'review'
      }));
      
      const groups = groupPasswordsByDomain(entries);
      setPasswordGroups(groups);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please make sure it\'s a valid export file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const allEntries = passwordGroups.flatMap(group => group.entries);
    const csv = exportToCSV(allEntries);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_passwords.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const updatePasswordStatus = (groupUrl: string, entryIndex: number, status: PasswordEntry['status']) => {
    setPasswordGroups(prevGroups => 
      prevGroups.map(group => {
        if (group.url === groupUrl) {
          const newEntries = [...group.entries];
          newEntries[entryIndex] = { ...newEntries[entryIndex], status };
          return { ...group, entries: newEntries };
        }
        return group;
      })
    );
  };

  const handleBulkUpdateStatus = (groupUrl: string, status: PasswordEntry['status']) => {
    setPasswordGroups(prevGroups =>
      prevGroups.map(group => {
        if (group.url === groupUrl) {
          const newEntries = group.entries.map(entry => ({ ...entry, status }));
          return { ...group, entries: newEntries };
        }
        return group;
      })
    );
  };

  return (
    <main className="min-h-screen">
      <div className="bg-gradient-to-b from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <a
              href="https://github.com/peaktwilight/chrome-csv-password-cleaner"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/30 rounded-full mb-8 hover:bg-blue-500/40 transition-colors duration-200"
            >
              <CodeBracketIcon className="w-5 h-5" />
              <span className="text-sm font-medium">100% Open Source on GitHub</span>
            </a>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              CSV Password Cleaner
            </h1>
            <p className="mt-6 text-xl text-blue-100 max-w-3xl mx-auto">
              Securely organize and clean up your password exports from Chrome, Brave, Edge, and other Chromium-based browsers.
              All processing happens locally in your browser for maximum privacy.
            </p>
            
            <div className="mt-12 flex flex-col items-center gap-6">
              <div 
                className={`w-full max-w-lg p-8 rounded-xl border-2 border-dashed transition-all duration-200 
                  ${dragActive 
                    ? 'border-blue-300 bg-blue-700' 
                    : 'border-blue-400 bg-blue-700/50 hover:bg-blue-700/70'
                  }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <label className="flex flex-col items-center justify-center cursor-pointer gap-4">
                  <ArrowUpTrayIcon className="w-8 h-8" />
                  <span className="text-lg font-medium">
                    {dragActive ? 'Drop your CSV file here' : 'Drag & drop or click to upload CSV'}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <ExportInstructions />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!passwordGroups.length && !isLoading && (
          <>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 mt-8">
              {[
                {
                  icon: ShieldCheckIcon,
                  title: 'Secure & Private',
                  description: 'All processing happens locally in your browser. Your passwords never leave your device.'
                },
                {
                  icon: GlobeAltIcon,
                  title: 'Easy Testing',
                  description: 'Quick access to websites for testing your passwords during the cleanup process.'
                },
                {
                  icon: DocumentDuplicateIcon,
                  title: 'Smart Organization',
                  description: 'Automatically groups passwords by domain and helps identify duplicates.'
                }
              ].map((feature, index) => (
                <div key={index} className="relative bg-white rounded-2xl shadow-md p-6">
                  <div className="absolute top-0 -translate-y-1/2 bg-blue-600 rounded-lg p-3">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-24 bg-white rounded-3xl overflow-hidden shadow-xl">
              <div className="px-8 py-12 sm:px-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-xl">
                      <CodeBracketIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">100% Open Source</h2>
                      <p className="text-gray-600 mt-1">Built with transparency and community in mind</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href="https://github.com/peaktwilight/chrome-csv-password-cleaner"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                    >
                      <StarIcon className="w-5 h-5 mr-2" />
                      Star on GitHub
                    </a>
                    <a
                      href="https://github.com/peaktwilight/chrome-csv-password-cleaner/blob/main/CONTRIBUTING.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                      <ArrowTopRightOnSquareIcon className="w-5 h-5 mr-2" />
                      Contribute
                    </a>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    {
                      title: 'MIT License',
                      description: 'Free to use, modify, and distribute. No strings attached.'
                    },
                    {
                      title: 'Community Driven',
                      description: 'Built and maintained by developers who care about privacy.'
                    },
                    {
                      title: 'Fully Auditable',
                      description: 'Every line of code is open for review and improvement.'
                    }
                  ].map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-2 text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900">Want to contribute?</p>
                      <p className="text-gray-600 text-sm">We welcome all contributions, big or small.</p>
                    </div>
                  </div>
                  <a
                    href="https://github.com/peaktwilight/chrome-csv-password-cleaner/issues/new/choose"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 whitespace-nowrap"
                  >
                    Open an Issue
                  </a>
                </div>
              </div>
            </div>
          </>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-lg">Processing your passwords...</p>
          </div>
        ) : passwordGroups.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">
                Password Groups ({passwordGroups.length})
              </h2>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Export Cleaned CSV
              </button>
            </div>
            <PasswordList
              groups={passwordGroups}
              onUpdateStatus={updatePasswordStatus}
              onBulkUpdateStatus={handleBulkUpdateStatus}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}

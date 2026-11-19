'use client';

import { validateExternalUrl } from '@/lib/url-shield';

interface ExternalLinkButtonProps {
  externalUrl: string;
  destinationDomain?: string;
  postTitle?: string;
}

export default function ExternalLinkButton({ externalUrl }: ExternalLinkButtonProps) {
  const validation = validateExternalUrl(externalUrl);
  const targetUrl = validation.isValid && validation.sanitizedUrl ? validation.sanitizedUrl : externalUrl;

  return (
    <div className="py-2">
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open external destination link"
        className="text-red-500 hover:text-red-400 font-bold text-base sm:text-lg break-all underline underline-offset-4 transition-colors"
      >
        {targetUrl}
      </a>
    </div>
  );
}

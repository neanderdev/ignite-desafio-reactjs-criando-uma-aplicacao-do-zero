import { NextApiRequest, NextApiResponse } from 'next';
import * as prismicNext from '@prismicio/next';

import { getPrismicClient } from '../../services/prismic';

function linkResolver(doc): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }

  return '/';
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  const client = getPrismicClient(req);

  await prismicNext.setPreviewData({ req, res });

  await prismicNext.redirectToPreviewURL({ req, res, client, linkResolver });
};

// src/pages/_app.tsx
import type { AppType } from 'next/dist/shared/lib/utils';
import type { AppRouter } from '../server/router';
import Head from 'next/head';
import { Router } from 'next/router';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import { loggerLink } from '@trpc/client/links/loggerLink';
import { withTRPC } from '@trpc/next';
import { SessionProvider } from 'next-auth/react';
import { ToastContainer } from 'react-toastify';
import superjson from 'superjson';
import nProgress from 'nprogress';

import 'react-toastify/dist/ReactToastify.css';
import '../styles/nprogress.css';
import '../styles/globals.css';

Router.events.on('routeChangeStart', nProgress.start);
Router.events.on('routeChangeError', nProgress.done);
Router.events.on('routeChangeComplete', nProgress.done);

const MyApp: AppType = ({ Component, pageProps: { session, ...pageProps } }) => {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>Billy</title>
        <meta name="description" content="Billy - Bill Splitting Made Easy" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="Billy - Manage Bills easily among Frientds" />
        <meta property="og:description" content="Billy - Bill Splitting Made Easy" />
        <meta property="og:type" content="website" />
      </Head>
      <Component {...pageProps} />
      <ToastContainer autoClose={3000} />
    </SessionProvider>
  );
};

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export default withTRPC<AppRouter>({
  config({ ctx }) {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    const url = `${getBaseUrl()}/api/trpc`;

    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({ url }),
      ],
      headers() {
        return {
          cookie: ctx?.req?.headers.cookie,
        };
      },
      url,
      transformer: superjson,
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      // queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: true,
})(MyApp);

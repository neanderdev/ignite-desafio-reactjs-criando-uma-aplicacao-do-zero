import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import { formatDate, formatDateEditPost } from '../../utils/formatData';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  prevPost: Post | null;
  nextPost: Post | null;
}

export default function Post({
  post,
  preview,
  prevPost,
  nextPost,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const totalWords = post.data.content.reduce(
    (totalContent, currentContent) => {
      const headingWords = currentContent.heading?.split(' ').length || 0;

      const bodyWords = currentContent.body.reduce((totalBody, currentBody) => {
        const textWords = currentBody.text.split(' ').length;
        return totalBody + textWords;
      }, 0);

      return totalContent + headingWords + bodyWords;
    },
    0
  );

  const timeEstimmed = Math.ceil(totalWords / 200);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      {post.data.banner.url !== null && (
        <img
          src={post.data.banner.url}
          alt="banner"
          className={styles.banner}
        />
      )}

      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.info}>
            <time>
              <FiCalendar />
              {formatDate(post.first_publication_date)}
            </time>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <time>
              <FiClock />
              {timeEstimmed} min
            </time>
          </div>

          {post.last_publication_date &&
            post.last_publication_date !== post.first_publication_date && (
              <div className={styles.edit}>
                <span>
                  * editado em {formatDateEditPost(post.last_publication_date)}
                </span>
              </div>
            )}

          {post.data.content.map(content => {
            return (
              <section key={content.heading} className={styles.postContent}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </section>
            );
          })}
        </article>

        <footer className={styles.navigationController}>
          <div>
            {prevPost && (
              <Link href={`/post/${prevPost.uid}`}>
                <a>
                  <h4>{prevPost.data.title}</h4>
                  <span>Post anterior</span>
                </a>
              </Link>
            )}
          </div>
          <div>
            {nextPost && (
              <Link href={`/post/${nextPost.uid}`}>
                <a>
                  <h4>{nextPost.data.title}</h4>
                  <span>Próximo post</span>
                </a>
              </Link>
            )}
          </div>
        </footer>

        {preview && (
          <aside className={commonStyles.exitPreviewButton}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismicClient = getPrismicClient();
  const posts = await prismicClient.query([
    prismic.Predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismicClient = getPrismicClient();
  const { slug } = params;
  const response = await prismicClient.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date ?? `${new Date()}`,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url ? response.data.banner.url : null,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  const prevPost = await prismicClient.query(
    [prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: ['document.first_publication_date'],
      after: response.id,
    }
  );

  const nextPost = await prismicClient.query(
    [prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: ['document.first_publication_date desc'],

      after: response.id,
    }
  );

  return {
    props: {
      post,
      preview,
      prevPost: prevPost.results[0] ?? null,
      nextPost: nextPost.results[0] ?? null,
    },
    revalidate: 60 * 5, // 5 minutes
  };
};

import { GetStaticPaths, GetStaticProps } from 'next';
import Head from "next/head";

import { getPrismicClient } from '../../services/prismic';
import Prismic from "@prismicio/client";
import { RichText } from 'prismic-dom';

import { format } from "date-fns"

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
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
}

export default function Post({ post }: PostProps) {
  const router = useRouter()

  const wordCounter = post.data.content.reduce((counter, text) => {
    const header = text.heading?.split(/\s/)

    const body = RichText.asText(text.body).split(/\s/)
    
    const length = header?.length + body?.length 

    return counter =+ length
  }, 0)

  function readTime(wordNum: number) {
    const time = Math.ceil(wordNum / 200) + 1
    return time
  }

  return (
    <>
      {!router.isFallback ? (
        <>
          <Head>
            <title>{post.data.title} | SpaceTraveling</title>
          </Head>

          <Header />

          <img src={post.data.banner.url} alt="banner" className={styles.banner} />

          <main className={`${commonStyles.container} ${styles.container}`}>
            <h1 className={styles.postTitle}>{post.data.title}</h1>

            <div className={styles.postInfo}>
              <FiCalendar size="20px" />
              <span >{String(format(new Date(post.first_publication_date), 'd MMM y')).toLowerCase()}</span>
              <FiUser size="20px" />
              <span>{post.data.author}</span>
              <FiClock size="20px" />
              <span>{readTime(wordCounter)} min</span>
            </div>

            {post.data.content.map((article, index) => {
              return (
                <article key={index} className={styles.postContent}>
                  <h2 className={styles.articleTitle}>{article.heading}</h2>
                  <div className={styles.articleBody} dangerouslySetInnerHTML={{ __html: RichText.asHtml(article.body) }} />
                </article>
              )
            })}
          </main>
        </>
      ) : (
        <>
          <Header/>
          <h2>Carregando...</h2>
        </>
      )}
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(Prismic.predicates.at('document.type', 'post'));

  const slugs = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return {
    paths: slugs,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content
    }
  }

  return {
    props: {
      post
    },
    revalidate: 60 * 60,
  }
};

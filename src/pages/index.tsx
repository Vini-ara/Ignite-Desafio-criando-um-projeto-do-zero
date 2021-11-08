import Head from 'next/head'
import Link from "next/link"

import { FiUser, FiCalendar } from 'react-icons/fi'

import { getPrismicClient } from '../services/prismic';
import Prismic from "@prismicio/client";

import { format } from 'date-fns';


import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [nextPage, setNextPage] = useState<string>(() => {
    if (!postsPagination.next_page) return ''

    return postsPagination.next_page
  })

  const [posts, setPosts] = useState<Post[]>(() => {
    if (!postsPagination.results) return []

    return postsPagination.results
  })


  async function loadMore(nextUrl: string) {
    const response = await (await fetch(nextUrl)).json()

    setNextPage(response.next_page)

    const results = response.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author
        }
      }
    })

    setPosts((prevPosts) => {
      return [...prevPosts, ...results]
    })
  }


  return (
    <>
      <Head>
        <title>Home | SpaceTraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <header className={styles.header}>
          <img src="./Logo.svg" alt="logo" />
        </header>
        <div className={styles.content}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a className={styles.post}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>

                <span className={styles.postPublicationDate}>
                  <FiCalendar size="20px" />
                  {String(format(new Date(post.first_publication_date), 'd MMM y')).toLowerCase()}
                </span>

                <span className={styles.postAuthor}>
                  <FiUser size="20px" />
                  {post.data.author}
                </span>
              </a>
            </Link>
          ))}

          {nextPage ? (
            <a onClick={() => { loadMore(nextPage) }} className={styles.loadMoreBtn}>
              Carregar mais posts
            </a>
          ) : null}
        </div>
      </main>
    </>
  )
}

export const getStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    { pageSize: 1 }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  const postsPagination = {
    next_page: postsResponse.next_page,
    results
  }

  return {
    props: {
      postsPagination
    },
    revalidate: 60 * 60,
  }
};

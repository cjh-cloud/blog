import React from 'react'
import { Link } from 'gatsby'

import Layout from '../components/layout'
import Head from '../components/head'

const AboutPage = () => {
    return (
        <Layout>
            <Head title="About" />
            <h1>About Me</h1>
            <p>I'm an Computer Systems, IIoT, and DevSecOps Engineer.</p>

            <p><Link to="/contact">Want to see what else I've done, or get in touch?</Link></p>

            <h1>About the blog</h1>
            <p>
                This blog is a Gatsby site. <a href="https://www.youtube.com/watch?v=kzWIUX3C" target="_blank">
                    Built using this tutorial.
                </a>
            </p>
            <p>
                <a href="https://github.com/marketplace/actions/gatsby-publish" target="_blank">
                    This GitHub Action
                </a> builds on the develop branch and pushes it to master.
                GitHub Pages then hosts the build in the master branch.
            </p>
        </Layout>
    )
}

export default AboutPage
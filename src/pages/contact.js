import React from 'react'

import Layout from '../components/layout'
import Head from '../components/head'

const ContactPage = () => {
    return (
        <Layout>
            <Head title="Contact" />
            <h1>Contact</h1>
            <p>
                My Repos, articles, and projects I've worked on...
            </p>
            <p>
                <a href="https://github.com/SenorGrande" target="_blank">GitHub</a>
                <br />
                <a href="https://medium.com/@cj-hewett" target="_blank">Medium</a>
                <br />
                <a href="http://tetris-frontend.s3-website-ap-southeast-2.amazonaws.com/" target="_blank">Tetris clone I built with React, S3, Lambda & DynamoDB</a>
            </p>
        </Layout>
    )
}

export default ContactPage
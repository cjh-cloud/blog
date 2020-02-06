import React from 'react'

import Layout from '../components/layout'
import Head from '../components/head'

const ContactPage = () => {
    return (
        <Layout>
            <Head title="Contact" />
            <h1>Contact</h1>
            <p>
                My LinkedIn, repos, articles, and projects I've worked on...
            </p>
            <p>
                <a href="https://nz.linkedin.com/in/connor-hewett" target="_blank">LinkedIn</a>
                <br />
                <a href="https://github.com/SenorGrande" target="_blank">GitHub</a>
                <br />
                <a href="https://medium.com/@hewett.j.connor" target="_blank">Medium</a>
                <br />
                <a href="http://tetris-frontend.s3-website-ap-southeast-2.amazonaws.com/" target="_blank">Tetris</a>
            </p>
        </Layout>
    )
}

export default ContactPage
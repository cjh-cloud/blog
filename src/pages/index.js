import React from 'react'
import { Link } from 'gatsby' // Link is a main export?

import Layout from '../components/layout'
import Head from '../components/head'

// Our React Component
const IndexPage = () => {
    return (
        <Layout>
            <Head title="Home" />
            {/* Children props? */}
            <h1>Hello.</h1>
            <h2>I am Senor Grande.</h2>
            <p>Need a developer? <Link to="/contact">Contact me.</Link></p> {/* to is a prop */}
        </Layout>
    )
}

export default IndexPage

// export default () => <div>The Great Gatsby Bootcamp</div> // export a functional component
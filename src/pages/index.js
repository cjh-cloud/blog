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
            <h1>Kia Ora </h1>
            <h2>I'm Connor - aka Senor Grande 👋</h2>

            <p>🕹️ I’m working on building keyboard peripherals with Eletron, Johnny-Five and Arduino</p>
            <p>🔭 I’m currently learning Terraform and making games with Godot</p>
            <p>🥅 2020 Goals: Complete Hacktoberfest</p>
            <p>🌯 Fun fact: I love breakfast burritos</p>
            <p>Need a developer? <Link to="/contact">Contact me.</Link></p> {/* to is a prop */}
        </Layout>
    )
}

export default IndexPage

// export default () => <div>The Great Gatsby Bootcamp</div> // export a functional component
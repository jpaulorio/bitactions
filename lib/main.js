#! /usr/bin/env node

// <xbar.title>GitHub Actions Status</xbar.title>
// <xbar.version>v1.1</xbar.version>
// <xbar.author>Paulo Henrique Nonaka</xbar.author>
// <xbar.author.github>paulononaka</xbar.author.github>
// <xbar.desc>GitHub Actions status</xbar.desc>
// <xbar.image>https://github.com/paulononaka/bitactions/blob/master/images/sample.png?raw=true</xbar.image>
// <xbar.dependencies>node</xbar.dependencies>
// <xbar.abouturl>https://github.com/paulononaka/bitactions</xbar.abouturl>

const github = require('./github')
const localGit = require('./local_git')
const config = require('./config')
const moment = require('moment')
const humanizeDuration = require("humanize-duration")

module.exports.start = async () => {

    let output = []
    let status = []

    const repositories = await github.getRepositories()
    const ignoredRepositories = config.ignoredRepos
    const ignoredWorkflows = config.ignoredWorkflows

    repositories.sort(function (a, b) {
        return a.name.localeCompare(b.name)
    });

    const filteredRepositories = repositories.filter(function (repo) {
        return ignoredRepositories.filter(i => repo.name.toLowerCase().includes(i.toLowerCase())).length == 0;
    });

    for (let i = 0; i < filteredRepositories.length; i++) {

        const repository = filteredRepositories[i]
        const workflows = await github.getWorkflows(repository.name)

        const filteredWorkflows = workflows.filter(function (workflow) {
            return ignoredWorkflows.filter(i => workflow.name.toLowerCase().includes(i.toLowerCase())).length == 0;
        });

        filteredWorkflows.sort(function (a, b) {
            return a.name.localeCompare(b.name)
        });

        for (let i = 0; i < filteredWorkflows.length; i++) {

            const workflow = filteredWorkflows[i]

            if (workflow.state == 'active') {

                const run = await github.getLastRun(repository.name, workflow.id)

                try {
                    await submenus(output, github, repository.name, workflow.name, run)

                    if (statusRotate() || statusSummarized()) {
                        status.push({
                            icon: icon(run.conclusion),
                            name: workflow.name
                        })
                    }
                } catch { }
            }
        }
    }

    for (let i = 0; i < status.length; i++) {
        if (statusSummarized()) {
            process.stdout.write(status[i].icon)
            if (i == status.length - 1) {
                console.log()
            }
        } else {
            console.log(`${status[i].icon} ${status[i].name}`)
        }
    }

    console.log('---')

    for (let i = 0; i < output.length; i++) {
        console.log(output[i])
    }
}

async function submenus(output, github, repoName, workflowName, run) {
    var jobs = await github.getJobs(repoName, run.id);

    print(output, '--', run.conclusion, repoName + '::' + workflowName, { html_url: run.html_url })

    for (let j = 0; j < jobs.length; j++) {

        const job = jobs[j]
        print(output, '----', job.conclusion, job.name, { itemDuration: job, html_url: job.html_url })

        for (let k = 0; k < job.steps.length; k++) {

            const step = job.steps[k]
            print(output, '------', step.conclusion, step.name, { itemDuration: step, html_url: job.html_url })
        }
    }
}

function statusRotate() {
    return config.statusMode && config.statusMode == "rotate"
}

function statusSummarized() {
    return config.statusMode == undefined || config.statusMode && config.statusMode == "summary"
}

function print(output, level, status, name, options) {
    let duration = ''
    if (options.itemDuration != undefined) {
        let item = options.itemDuration
        const diff = moment(item.completed_at).diff(moment(item.started_at), 'milliseconds')
        duration = '\x1b[0;36m' + ` (${humanizeDuration(diff)})` + '\x1b[0m'
    }
    let href = ` | href=${options.html_url}`
    output.push(`${level} ${icon(status)} ${name}${duration}${href}`)
}

function icon(status) {
    switch (status) {
        case 'success': return '\x1b[0;32m●\x1b[0m'
        case 'failure': return '\x1b[0;31m●\x1b[0m'
        case 'cancelled': return '\x1b[0;37m●\x1b[0m'
        case 'pending': return '\x1b[0;34m●\x1b[0m'
        case 'skipped': return '\x1b[0;30m●\x1b[0m'
        default: return '\x1b[0;34m●\x1b[0m'
    }
}
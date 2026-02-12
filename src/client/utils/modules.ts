const defaultClass = "flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
const activeClass = "flex items-center gap-3 px-3 py-2 bg-primary/5 text-primary rounded-lg font-medium"

export const modules = [
    {
        name: "Dashboard",
        url: "/",
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>`,
        className: defaultClass,
        activeClassName: activeClass
    },
    {
        name: "My Files",
        url: "/files",
        activeUrls: ["/files", "/detail"],
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>`,
        className: defaultClass,
        activeClassName: activeClass
    },
    {
        name: "Upload",
        url: "/upload",
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>`,
        className: defaultClass,
        activeClassName: activeClass
    },
    {
        name: "Recent",
        url: "/recent",
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
        className: defaultClass,
        activeClassName: activeClass
    }
]

export const labels = [
    {
        name: "Urgent",
        color: "bg-red-500",
        url: "/label/urgent"
    },
    {
        name: "Work",
        color: "bg-orange-500",
        url: "/label/work"
    },
    {
        name: "Personal",
        color: "bg-green-500",
        url: "/label/personal"
    }
]
import { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { BottomNav } from './BottomNav'

interface LayoutProps {
  children?: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col min-w-0">
      <Header />
      <main className="flex-1 flex flex-col min-w-0 w-full">{children || <Outlet />}</main>
      <Footer />
      <BottomNav />
    </div>
  )
}

export default Layout

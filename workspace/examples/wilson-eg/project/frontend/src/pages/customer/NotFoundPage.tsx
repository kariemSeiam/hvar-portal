import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/Button'
import { Home, ArrowLeft, Package } from 'lucide-react'

const NotFoundPage = () => {
  const { language } = useLanguage()

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center section-padding section-creative-warm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Package className="h-24 w-24 text-muted-foreground/50 mb-6" aria-hidden />
      <h1 className="text-h2 font-bold text-foreground mb-2 title-underline-gold title-underline-gold-center">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        {language === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button asChild>
          <Link to="/" className="inline-flex items-center gap-2">
            <Home className="h-5 w-5" />
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
        </Button>
        <Button variant="outline" onClick={() => window.history.back()} className="inline-flex items-center gap-2">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          {language === 'ar' ? 'رجوع' : 'Go Back'}
        </Button>
      </div>
    </div>
  )
}

export default NotFoundPage

import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Settings, Info } from 'lucide-react'
import { useAdminSettings } from '@/hooks/useAdmin'

export default function SettingsPage() {
  const { language } = useLanguage()
  const { data: settings, isLoading, error } = useAdminSettings()

  const translations = {
    title: language === 'ar' ? 'الإعدادات' : 'Settings',
    infoTitle: language === 'ar' ? 'حالة الإعدادات' : 'Settings status',
    apiWorks: language === 'ar' ? 'واجهة الإعدادات تعمل وتخزن البيانات.' : 'Settings API works and persists data.',
    notWired: language === 'ar'
      ? 'إعدادات الشحن والدفع والإشعارات غير مربوطة بالسلة أو الطلبات أو إرسال الرسائل.'
      : 'Shipping, payment, and notification settings are not wired to cart, orders, or SMS.',
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-destructive">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-wide py-6 lg:py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-h2 font-bold text-foreground">{translations.title}</h1>
        </div>

        <div className="max-w-xl">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-lg bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                <Settings className="h-5 w-5 text-gold-600 dark:text-gold-400" />
              </div>
              <CardTitle>{translations.infoTitle}</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4 pt-6">
              {isLoading ? (
                <p className="text-muted-foreground text-sm">…</p>
              ) : (
                <>
                  <p className="text-foreground text-sm flex items-start gap-2">
                    <Info className="h-4 w-4 text-gold-600 dark:text-gold-400 shrink-0 mt-0.5" />
                    {translations.apiWorks}
                  </p>
                  <p className="text-muted-foreground text-sm">{translations.notWired}</p>
                  {settings && (
                    <p className="text-muted-foreground text-xs font-mono">
                      {language === 'ar' ? 'المخزن' : 'Stored'}: {Object.keys(settings).length} {language === 'ar' ? 'مفتاح' : 'keys'}
                    </p>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

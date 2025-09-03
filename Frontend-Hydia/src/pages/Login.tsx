import { useState } from "react"
import { Eye, EyeOff, Shield, Lock, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HydiaButton } from "@/components/ui/hydia-button"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/hooks/useAuth"
import { OrganizationSelector } from "@/components/auth/OrganizationSelector"
import hydiaLogo from "@/assets/hydia-logo.png"

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [showOrgSelector, setShowOrgSelector] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  })

  const { login, isLoading, organizations, isAuthenticated } = useAuth()

  // Si l'utilisateur a plusieurs orgs et doit choisir
  if (showOrgSelector || (organizations.length > 1 && !isAuthenticated)) {
    return <OrganizationSelector />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    try {
      await login(formData.email, formData.password)
      
      // Si l'utilisateur a plusieurs orgs, afficher le sélecteur
      if (organizations.length > 1) {
        setShowOrgSelector(true)
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion")
    }
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Background Pattern - Plus subtil et professionnel */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white" />
      
      {/* Grid Pattern léger */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: `
            linear-gradient(rgba(46, 191, 165, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(46, 191, 165, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <Card className="w-full max-w-md mx-4 bg-white border-gray-200 shadow-xl animate-fade-in">
        <CardHeader className="text-center space-y-6 p-8">
          <div className="flex justify-center animate-scale-in">
            <div className="h-20 w-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <img 
                src={hydiaLogo} 
                alt="HYDIA" 
                className="h-12 w-12 object-contain"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-gray-900 font-inter">
              Connexion HYDIA
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Plateforme de gestion sécurisée des données d'entreprise
            </CardDescription>
          </div>
          
          {/* Security Status */}
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Connexion sécurisée SSL</span>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Adresse e-mail
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  placeholder="votre@email.com"
                  className="pl-11 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500/20 text-gray-900 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  placeholder="••••••••••••"
                  className="pl-11 pr-12 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500/20 text-gray-900 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="remember"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                }
                className="border-gray-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
              <Label 
                htmlFor="remember"
                className="text-sm text-gray-600 cursor-pointer font-medium"
              >
                Se souvenir de moi
              </Label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  Se connecter
                </>
              )}
            </button>

            {/* Additional Links */}
            <div className="text-center space-y-4">
              <button 
                type="button"
                className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200 hover:underline"
              >
                Mot de passe oublié ?
              </button>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>Connexion sécurisée avec chiffrement AES-256</p>
                <p>Authentification multi-facteurs disponible</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bottom Security Info */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm">
          <Lock className="h-3 w-3" />
          <span>Conforme RGPD • ISO 27001 • SOC 2</span>
        </div>
      </div>
    </div>
  )
}
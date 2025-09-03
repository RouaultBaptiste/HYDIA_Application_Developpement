import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HydiaButton } from '@/components/ui/hydia-button';
import { Building2, Users, ChevronRight } from 'lucide-react';

export function OrganizationSelector() {
  const { organizations, selectOrganization } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  const handleSelectOrganization = async () => {
    if (!selectedOrgId) return;
    
    try {
      setIsLoading(true);
      await selectOrganization(selectedOrgId);
    } catch (error) {
      console.error('Erreur sélection organisation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Sélectionner une organisation
          </CardTitle>
          <CardDescription>
            Choisissez l'organisation avec laquelle vous souhaitez travailler
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {organizations.map((org) => (
            <div
              key={org.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedOrgId === org.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedOrgId(org.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{org.role}</p>
                  </div>
                </div>
                {selectedOrgId === org.id && (
                  <ChevronRight className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>
          ))}
          
          <HydiaButton
            onClick={handleSelectOrganization}
            disabled={!selectedOrgId || isLoading}
            className="w-full"
          >
            {isLoading ? 'Connexion...' : 'Continuer'}
          </HydiaButton>
        </CardContent>
      </Card>
    </div>
  );
}

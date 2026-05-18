import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff, Trash2, Plus } from "lucide-react";

interface XTComCredentials {
  id: string;
  apiKey: string;
  apiSecret: string;
  accountName: string;
  isConnected: boolean;
  lastSync: string;
}

/**
 * Компонент для управления API ключами XT.COM
 */
export function XTComSettings() {
  const [credentials, setCredentials] = useState<XTComCredentials[]>([
    {
      id: "1",
      apiKey: "xt_****...****",
      apiSecret: "****...****",
      accountName: "Trading Account 1",
      isConnected: true,
      lastSync: "2026-05-18 15:30:00",
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    apiKey: "",
    apiSecret: "",
    accountName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddCredentials = async () => {
    if (!formData.apiKey || !formData.apiSecret || !formData.accountName) {
      setError("Заполните все поля");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Имитация проверки подключения
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newCredential: XTComCredentials = {
        id: Date.now().toString(),
        apiKey: `xt_${formData.apiKey.slice(-8)}`,
        apiSecret: "****...****",
        accountName: formData.accountName,
        isConnected: true,
        lastSync: new Date().toLocaleString(),
      };

      setCredentials([...credentials, newCredential]);
      setFormData({ apiKey: "", apiSecret: "", accountName: "" });
      setShowForm(false);
      setSuccess("API ключи успешно добавлены!");

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Ошибка при добавлении API ключей");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCredentials = (id: string) => {
    if (confirm("Вы уверены? Это действие нельзя отменить.")) {
      setCredentials(credentials.filter((c) => c.id !== id));
    }
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h2 className="text-2xl font-bold">XT.COM Интеграция</h2>
        <p className="text-gray-600 mt-1">Подключите ваш XT.COM аккаунт для импорта позиций и торговли</p>
      </div>

      {/* Сообщения об ошибках и успехе */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Форма добавления */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Добавить новый аккаунт</CardTitle>
            <CardDescription>Введите API ключи из XT.COM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="accountName">Название аккаунта</Label>
              <Input
                id="accountName"
                placeholder="например, Trading Account 1"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Введите ваш API Key"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Получите API ключ в настройках безопасности XT.COM
              </p>
            </div>

            <div>
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Введите ваш API Secret"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Храните это значение в безопасности
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAddCredentials}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  "Добавить"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Кнопка добавления */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="gap-2 w-full">
          <Plus className="w-4 h-4" />
          Добавить аккаунт XT.COM
        </Button>
      )}

      {/* Список подключённых аккаунтов */}
      <div className="space-y-4">
        <h3 className="font-semibold">Подключённые аккаунты</h3>

        {credentials.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">Нет подключённых аккаунтов</p>
          </Card>
        ) : (
          credentials.map((cred) => (
            <Card key={cred.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{cred.accountName}</h4>
                      <div
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          cred.isConnected
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cred.isConnected ? "Подключено" : "Отключено"}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">API Key:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {cred.apiKey}
                        </code>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">API Secret:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {showSecrets[cred.id] ? cred.apiSecret : "••••••••"}
                        </code>
                        <button
                          onClick={() => toggleSecretVisibility(cred.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {showSecrets[cred.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <p className="text-gray-500">
                        Последняя синхронизация: {cred.lastSync}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCredentials(cred.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Информация */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Как получить API ключи?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>Перейдите на XT.COM и войдите в аккаунт</li>
            <li>Откройте Настройки → Безопасность → API Management</li>
            <li>Создайте новый API ключ</li>
            <li>Скопируйте API Key и API Secret</li>
            <li>Вставьте их выше</li>
          </ol>
          <p className="text-xs text-gray-600 mt-3">
            ⚠️ Никогда не делитесь вашими API ключами. Они дают полный доступ к вашему аккаунту.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

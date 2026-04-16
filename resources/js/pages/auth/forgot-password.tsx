// Components
import { Link } from '@inertiajs/react';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {

    const translate = (text?: string) => {
        if (!text) return text;
        
        const translations: Record<string, string> = {
            "We have emailed your password reset link.": "Мы отправили ссылку для сброса пароля на вашу почту!",
            "We can't find a user with that email address.": "Пользователь с таким email не найден.",
            "Please wait before retrying.": "Пожалуйста, подождите перед повторной попыткой.",
            "The email field is required.": "Поле Email обязательно для заполнения.",
            "The selected email is invalid.": "Выбранный email некорректен."
        };

        return translations[text] || text;
    };

    return (
        <AuthLayout
            title="Забыли пароль"
            description="Введите свой адрес электронной почты, чтобы получить ссылку для сброса пароля"
        >
            <Head title="Забыли пароль" />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                     {translate(status)}
                </div>
            )}

            <div className="space-y-6">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                />

                                <InputError message={translate(errors.email)} />
                            </div>

                            <div className="my-6 flex items-center justify-start">
                                <Button
                                    className="w-full"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Отправить ссылку для сброса
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

            <div className="space-x-1 text-center text-sm text-gray-500">
                <span>Вспомнили пароль?</span>
                <Link 
                    href={route('home')} 
                    className="text-blue-600 hover:underline font-medium"
                >
                    Вернуться ко входу
                </Link>
            </div>
            </div>
        </AuthLayout>
    );
}

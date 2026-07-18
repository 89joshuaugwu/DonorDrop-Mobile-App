import { useEffect, useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { sendPasswordResetEmail } from "firebase/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { login, signUp } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { useAuth, fetchUserProfiles } from "@/lib/AuthContext";
import { useGoogleAuthRequest, signInWithGoogleIdToken } from "@/lib/googleAuth";

export default function AuthScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: "donor" | "requester" }>();
  const { setActiveRole, refreshProfiles } = useAuth();

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const { request, response, promptAsync } = useGoogleAuthRequest();

  // Routes a freshly-authenticated uid to the right place: straight to
  // that role's home tab if they already have a profile (returning
  // user — via login OR Google, either can be a returning account), or
  // to the registration form if this is genuinely their first time.
  // This also protects existing donor stats (totalDonations, verified,
  // pushToken) from being wiped by donor-register's setDoc on a login
  // that used to always force the form.
  async function routeAfterAuth(uid: string) {
    const chosenRole = role === "requester" ? "requester" : "donor";
    await setActiveRole(chosenRole);

    const { donor, requester } = await fetchUserProfiles(uid);
    await refreshProfiles();

    if (chosenRole === "requester") {
      router.replace(requester ? "/(requester-tabs)/home" : "/(onboarding)/requester-register");
    } else {
      router.replace(donor ? "/(donor-tabs)/home" : "/(onboarding)/donor-register");
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const authedUser = mode === "signup" ? await signUp(email.trim(), password) : await login(email.trim(), password);
      await routeAfterAuth(authedUser.uid);
    } catch (err: any) {
      setError(err?.message?.replace("Firebase: ", "") || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // Fires when the system browser redirects back with a Google result.
  useEffect(() => {
    if (response?.type === "success" && response.params.id_token) {
      (async () => {
        setGoogleLoading(true);
        setError("");
        try {
          const authedUser = await signInWithGoogleIdToken(response.params.id_token);
          await routeAfterAuth(authedUser.uid);
        } catch (err: any) {
          setError(err?.message?.replace("Firebase: ", "") || "Google sign-in failed. Try again.");
        } finally {
          setGoogleLoading(false);
        }
      })();
    } else if (response?.type === "error") {
      setError("Google sign-in was cancelled or failed.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert("Enter your email", "Type your email above first, then tap \"Forgot password?\" again.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Check your email",
        `We sent a password reset link to ${email.trim()}. Open it to set a new password, then come back and log in.`
      );
    } catch (err: any) {
      Alert.alert("Couldn't send reset email", err?.message?.replace("Firebase: ", "") || "Try again.");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
          <Text className="text-2xl font-extrabold text-brand-text mb-1">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </Text>
          <Text className="text-brand-textsecondary mb-6">
            {role === "requester" ? "Signing up as a requester" : "Signing up as a donor"}
          </Text>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 6 characters"
          />

          {mode === "login" && (
            <Text
              onPress={handleForgotPassword}
              className="text-brand-red text-sm font-medium mb-4 -mt-2"
            >
              Forgot password?
            </Text>
          )}

          {!!error && <Text className="text-red-600 text-sm mb-4">{error}</Text>}

          <Button
            title={mode === "signup" ? "Sign up" : "Log in"}
            onPress={handleSubmit}
            loading={loading}
          />

          <View className="flex-row items-center my-5">
            <View className="flex-1 h-px bg-brand-border" />
            <Text className="text-brand-textsecondary text-xs mx-3">OR</Text>
            <View className="flex-1 h-px bg-brand-border" />
          </View>

          <Button
            title="Continue with Google"
            onPress={() => promptAsync()}
            variant="outline"
            loading={googleLoading}
            disabled={!request}
          />

          <View className="mt-3">
            <Button
              title={mode === "signup" ? "I already have an account" : "I need to create an account"}
              onPress={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError("");
              }}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

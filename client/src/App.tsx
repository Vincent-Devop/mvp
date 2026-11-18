import { useEffect, type ReactNode } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Admin from "@/pages/Admin";
import AdminLive from "@/pages/AdminLive";
import Cart from "@/pages/Cart";
import { AccountPage, ComparePage, TrackOrderPage, WholesaleRegisterPage, WishlistPage } from "@/pages/ContentPage";
import ContentPage from "@/pages/ContentPage";
import Checkout, { OrderConfirmation } from "@/pages/Checkout";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import POS from "@/pages/POS";
import POSLive from "@/pages/POSLive";
import ProductDetail from "@/pages/ProductDetail";
import Shop from "@/pages/Shop";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CommerceProvider } from "./contexts/CommerceContext";
import { useAuth } from "./_core/hooks/useAuth";
import { startLogin } from "./const";

function StaffOnly({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  useEffect(() => { document.title = "Staff Workspace | PRINCE BENJA DESIGNS"; }, []);
  if (loading) return <main className="access-screen"><span className="eyebrow">PRINCE BENJA DESIGNS</span><p>Checking staff access…</p></main>;
  if (!user) return <main className="access-screen"><div className="access-card"><span className="access-icon"><LockKeyhole size={22} /></span><span className="eyebrow">Protected workspace</span><h1>Staff sign-in</h1><p>The management and point-of-sale routes are protected. Sign in with the authorised account to continue. Customers can browse and use guest checkout without signing in.</p><button className="button-primary button-dark" onClick={startLogin}>Sign in <ArrowRight size={15} /></button><a href="/" className="access-back">Return to the storefront</a></div></main>;
  if (user.role !== "admin") return <main className="access-screen"><div className="access-card"><span className="eyebrow">Access restricted</span><h1>Not authorised.</h1><p>This account does not have the admin role. Ask the business owner to configure authorised staff access.</p><a href="/" className="access-back">Return to the storefront</a></div></main>;
  return <>{children}</>;
}

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/shop" component={Shop} />
    <Route path="/search" component={Shop} />
    <Route path="/categories" component={Shop} />
    <Route path="/categories/:slug" component={Shop} />
    <Route path="/new-arrivals" component={Shop} />
    <Route path="/best-sellers" component={Shop} />
    <Route path="/offers" component={Shop} />
    <Route path="/products/:slug" component={ProductDetail} />
    <Route path="/cart" component={Cart} />
    <Route path="/checkout" component={Checkout} />
    <Route path="/order-confirmation/:reference" component={OrderConfirmation} />
    <Route path="/track-order" component={TrackOrderPage} />
    <Route path="/wishlist" component={WishlistPage} />
    <Route path="/compare" component={ComparePage} />
    <Route path="/wholesale/register" component={WholesaleRegisterPage} />
    <Route path="/admin/preview"><StaffOnly><Admin /></StaffOnly></Route>
    <Route path="/admin"><StaffOnly><AdminLive /></StaffOnly></Route>
    <Route path="/pos/preview"><StaffOnly><POS /></StaffOnly></Route>
    <Route path="/pos"><StaffOnly><POSLive /></StaffOnly></Route>
    <Route path="/account" component={AccountPage} />
    <Route path="/account/:section" component={AccountPage} />
    <Route path="/account/orders/:id" component={AccountPage} />
    <Route path="/blog/:slug" component={ContentPage} />
    <Route path="/about" component={ContentPage} />
    <Route path="/contact" component={ContentPage} />
    <Route path="/branches" component={ContentPage} />
    <Route path="/faq" component={ContentPage} />
    <Route path="/reviews" component={ContentPage} />
    <Route path="/privacy-policy" component={ContentPage} />
    <Route path="/terms" component={ContentPage} />
    <Route path="/returns" component={ContentPage} />
    <Route path="/delivery-policy" component={ContentPage} />
    <Route path="/wholesale" component={ContentPage} />
    <Route path="/blog" component={ContentPage} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><CommerceProvider><Router /></CommerceProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;

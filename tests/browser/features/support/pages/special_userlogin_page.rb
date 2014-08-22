class SpecialUserLoginPage < ArticlePage
  include PageObject
  include URL

  page_url URL.url("Special:UserLogin")

  h1(:first_heading, id: "firstHeading")
  div(:login_head_message, class: "headmsg")

  button(:login, id: "wpLoginAttempt")
  text_field(:username, name: "wpName")
  text_field(:password, name: "wpPassword")
  text_field(:confirm_password, id: "wpRetype")
  a(:login_wl, class: "button")
  button(:signup_submit, id: "wpCreateaccount")
  a(:create_account_link, text: "Create account")
  div(:message_box, class: "headmsg")
  a(:password_reset, css:".mw-userlogin-help")

  # signup specific
  text_field(:confirmation_field, id: "wpCaptchaWord")
  div(:refresh_captcha, id: "mf-captcha-reload-container")
  div(:create_account_status, id: "mw-createacct-status-area")

  def login_with(username, password)
    # deal with autocomplete
    self.username_element.when_present.clear
    self.username = username
    self.password = password
    login
  end
end
